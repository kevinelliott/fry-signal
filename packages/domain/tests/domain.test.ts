import { describe, expect, it } from "vitest";

import {
  MIDNIGHT_MERGE,
  createInitialShift,
  reduceShift,
  replayShift,
  restoreShift,
  serializeShift,
  type ShiftCommand,
  type ShiftFixture,
  type ShiftState,
} from "../src/index.js";

function reduceAll(commands: readonly ShiftCommand[]): ShiftState {
  return commands.reduce((state, command) => reduceShift(state, command), createInitialShift());
}

const openingBatches: readonly ShiftCommand[] = [
  { type: "READ", commandId: "read" },
  { type: "COMMIT", commandId: "c1", batchId: "chicken", component: "chicken", quantity: 30 },
  {
    type: "COMMIT",
    commandId: "c2",
    batchId: "fries",
    component: "waffle-fries",
    quantity: 30,
  },
  { type: "COMMIT", commandId: "c3", batchId: "biscuits", component: "biscuit", quantity: 20 },
  { type: "COMMIT", commandId: "c4", batchId: "slaw", component: "slaw", quantity: 20 },
  { type: "COMMIT", commandId: "c5", batchId: "drinks", component: "drink", quantity: 30 },
];

function settleCommands(prefix: string): readonly ShiftCommand[] {
  return [
    {
      type: "SWITCH",
      commandId: `${prefix}-rain-safe-route`,
      gate: "hot-gate",
      destination: "pack-b",
    },
    { type: "ADVANCE", commandId: `${prefix}-advance`, ticks: MIDNIGHT_MERGE.durationTicks },
    { type: "SETTLE", commandId: `${prefix}-settle` },
  ];
}

function mutableSnapshot(state: ShiftState): Record<string, any> {
  return JSON.parse(serializeShift(state)) as Record<string, any>;
}

describe("Midnight Merge fixture", () => {
  it("is a versioned three-wave fixture with bounded forecasts", () => {
    expect(MIDNIGHT_MERGE.version).toBe(2);
    expect(MIDNIGHT_MERGE.rulesVersion).toBe(2);
    expect(MIDNIGHT_MERGE.waves).toHaveLength(3);
    for (const wave of MIDNIGHT_MERGE.waves) {
      expect(wave.orders.length).toBeGreaterThanOrEqual(wave.forecast.minimumOrders);
      expect(wave.orders.length).toBeLessThanOrEqual(wave.forecast.maximumOrders);
    }
  });

  it("contains no ownership or connectivity state", () => {
    const stateText = JSON.stringify(createInitialShift()).toLowerCase();
    for (const forbidden of ["wallet", "network", "token", "contract", "indexer"]) {
      expect(stateText).not.toContain(forbidden);
    }
  });
});

describe("pure reducer and replay", () => {
  it("replays the same command log to the same state and digest", () => {
    const commands = [...openingBatches, ...settleCommands("clean")];
    const first = replayShift(commands);
    const second = replayShift(commands);
    expect(first.state).toEqual(second.state);
    expect(first.digest).toBe(second.digest);
  });

  it("round-trips a canonical save snapshot", () => {
    const state = reduceAll([...openingBatches, { type: "ADVANCE", commandId: "a", ticks: 140 }]);
    const restored = restoreShift(serializeShift(state));
    expect(restored).toEqual(state);
    expect(serializeShift(restored)).toBe(serializeShift(state));
  });

  it("makes command retries idempotent and rejects changed payload reuse", () => {
    const read = { type: "READ", commandId: "same" } as const;
    const once = reduceShift(createInitialShift(), read);
    expect(reduceShift(once, read)).toBe(once);
    expect(() =>
      reduceShift(once, { type: "ADVANCE", commandId: "same", ticks: 1 }),
    ).toThrow(/different payload/);
  });

  it("does not advance ticks or arrivals while paused", () => {
    let state = reduceAll(openingBatches);
    state = reduceShift(state, { type: "PAUSE", commandId: "pause" });
    const paused = reduceShift(state, { type: "ADVANCE", commandId: "paused-advance", ticks: 200 });
    expect(paused.tick).toBe(0);
    expect(paused.orders).toHaveLength(0);
    state = reduceShift(paused, { type: "RESUME", commandId: "resume" });
    state = reduceShift(state, { type: "ADVANCE", commandId: "live-advance", ticks: 20 });
    expect(state.tick).toBe(20);
    expect(state.orders).toHaveLength(1);
  });

  it("rejects ADVANCE before the forecast has been read", () => {
    const initial = createInitialShift();
    expect(() =>
      reduceShift(initial, { type: "ADVANCE", commandId: "advance-before-read", ticks: 1 }),
    ).toThrow(/only after reading the forecast/);
    expect(initial).toEqual(createInitialShift());
  });

  it("settles only from an unpaused final recovery window", () => {
    let state = reduceAll(openingBatches);
    expect(() => reduceShift(state, { type: "SETTLE", commandId: "early-settle" })).toThrow(
      /final recovery window/,
    );
    state = reduceShift(state, {
      type: "SWITCH",
      commandId: "safe-before-final",
      gate: "hot-gate",
      destination: "pack-b",
    });
    state = reduceShift(state, {
      type: "ADVANCE",
      commandId: "to-final-recovery",
      ticks: MIDNIGHT_MERGE.durationTicks,
    });
    expect(state.phase).toBe("FINAL_RECOVERY");
    state = reduceShift(state, { type: "PAUSE", commandId: "pause-final" });
    expect(() => reduceShift(state, { type: "SETTLE", commandId: "settle-paused" })).toThrow(
      /final recovery window/,
    );
    state = reduceShift(state, { type: "RESUME", commandId: "resume-final" });
    state = reduceShift(state, { type: "SETTLE", commandId: "truthful-settle" });
    expect(state.phase).toBe("SETTLED");
    expect(state.result).not.toBeNull();
  });

  it("rejects settlement while Rain recoveries remain open", () => {
    let state = reduceAll([
      ...openingBatches,
      { type: "ADVANCE", commandId: "open-rain-through-close", ticks: MIDNIGHT_MERGE.durationTicks },
    ]);
    expect(state.recoveries.filter((recovery) => recovery.state === "OFFERED")).toHaveLength(5);
    expect(() => reduceShift(state, { type: "SETTLE", commandId: "settle-open-rain" })).toThrow(
      /order or recovery remains open/,
    );
    expect(restoreShift(serializeShift(state))).toEqual(state);
  });

  it("rejects every new command after settlement while preserving exact retry idempotency", () => {
    const settleCommand = { type: "SETTLE", commandId: "immutable-settle" } as const;
    let state = reduceAll([
      ...openingBatches,
      {
        type: "SWITCH",
        commandId: "immutable-rain-safe-route",
        gate: "hot-gate",
        destination: "pack-b",
      },
      { type: "ADVANCE", commandId: "immutable-advance", ticks: MIDNIGHT_MERGE.durationTicks },
      settleCommand,
    ]);
    expect(reduceShift(state, settleCommand)).toBe(state);
    const mutations: readonly ShiftCommand[] = [
      { type: "READ", commandId: "settled-read" },
      { type: "COMMIT", commandId: "settled-commit", batchId: "late", component: "drink", quantity: 1 },
      { type: "SWITCH", commandId: "settled-switch", gate: "hot-gate", destination: "pack-b" },
      { type: "RECOVER", commandId: "settled-recover", recoveryId: "missing", action: "PULL_FORWARD" },
      { type: "ADVANCE", commandId: "settled-advance", ticks: 1 },
      { type: "PAUSE", commandId: "settled-pause" },
      { type: "RESUME", commandId: "settled-resume" },
      { type: "SETTLE", commandId: "settled-again" },
    ];
    for (const command of mutations) {
      expect(() => reduceShift(state, command)).toThrow(/settled shift is immutable/);
    }
  });
});

describe("route, recovery, and economics invariants", () => {
  it("applies route changes only to trays arriving after the switch", () => {
    let state = reduceAll(openingBatches);
    state = reduceShift(state, { type: "ADVANCE", commandId: "to-first", ticks: 20 });
    const firstRoute = state.orders[0]?.routeSnapshot;
    state = reduceShift(state, {
      type: "SWITCH",
      commandId: "switch-hot",
      gate: "hot-gate",
      destination: "pack-b",
    });
    state = reduceShift(state, { type: "ADVANCE", commandId: "to-second", ticks: 18 });
    expect(state.orders[0]?.routeSnapshot).toEqual(firstRoute);
    expect(state.orders[1]?.routeSnapshot.hot).toBe("pack-b");
  });

  it("enforces the announced Rain Detour from structured topology authority", () => {
    let missed = reduceAll(openingBatches);
    missed = reduceShift(missed, { type: "ADVANCE", commandId: "rain-missed", ticks: 132 });
    const missedOrder = missed.orders.find((order) => order.id === "mm-05");
    expect(missedOrder?.state).toBe("ROUTE_BLOCKED");
    expect(missedOrder?.routeSnapshot.hot).toBe("pack-a");
    expect(
      missed.recoveries.some(
        (recovery) => recovery.orderId === "mm-05" && recovery.cause === "ROUTE_BLOCKED",
      ),
    ).toBe(true);

    let anticipated = reduceAll(openingBatches);
    anticipated = reduceShift(anticipated, {
      type: "SWITCH",
      commandId: "rain-safe-route",
      gate: "hot-gate",
      destination: "pack-b",
    });
    anticipated = reduceShift(anticipated, {
      type: "ADVANCE",
      commandId: "rain-safe-arrival",
      ticks: 132,
    });
    const safeOrder = anticipated.orders.find((order) => order.id === "mm-05");
    expect(safeOrder?.state).toBe("DISPATCHED");
    expect(safeOrder?.routeSnapshot.hot).toBe("pack-b");
    expect(anticipated.recoveries.some((recovery) => recovery.orderId === "mm-05")).toBe(false);
  });

  it("preserves switch timing at the Rain Detour arrival boundary", () => {
    const commands: readonly ShiftCommand[] = [
      ...openingBatches,
      { type: "ADVANCE", commandId: "rain-before", ticks: 131 },
      {
        type: "SWITCH",
        commandId: "rain-boundary-switch",
        gate: "hot-gate",
        destination: "pack-b",
      },
      { type: "ADVANCE", commandId: "rain-boundary-arrival", ticks: 1 },
    ];
    const state = reduceAll(commands);
    expect(state.orders.find((order) => order.id === "mm-05")?.state).toBe("DISPATCHED");

    const restored = restoreShift(serializeShift(state));
    expect(restored).toEqual(state);
    expect(replayShift(commands).state).toEqual(state);
  });

  it("restores mid-detour before the route decision without changing authority", () => {
    const beforeDecision = reduceAll([
      ...openingBatches,
      { type: "ADVANCE", commandId: "rain-window-open", ticks: 121 },
    ]);
    const restored = restoreShift(serializeShift(beforeDecision));
    expect(restored).toEqual(beforeDecision);

    const switchCommand = {
      type: "SWITCH",
      commandId: "rain-after-restore",
      gate: "hot-gate",
      destination: "pack-b",
    } as const;
    const arrivalCommand = {
      type: "ADVANCE",
      commandId: "rain-after-restore-arrival",
      ticks: 11,
    } as const;
    const resumed = [switchCommand, arrivalCommand].reduce(
      (current, command) => reduceShift(current, command),
      restored,
    );
    const uninterrupted = reduceAll([
      ...openingBatches,
      { type: "ADVANCE", commandId: "rain-window-open", ticks: 121 },
      switchCommand,
      arrivalCommand,
    ]);

    expect(resumed).toEqual(uninterrupted);
    expect(resumed.orders.find((order) => order.id === "mm-05")?.state).toBe("DISPATCHED");
  });

  it("applies inclusive modifier edges and leaves adjacent arrivals open", () => {
    const rainWave = MIDNIGHT_MERGE.waves[1];
    const edgeFixture: ShiftFixture = {
      ...MIDNIGHT_MERGE,
      waves: [
        MIDNIGHT_MERGE.waves[0],
        {
          ...rainWave,
          topologyModifier: {
            ...rainWave.topologyModifier!,
            startsAtTick: 132,
            endsAtTick: 219,
          },
          orders: rainWave.orders.map((order) =>
            order.id === "mm-05"
              ? { ...order, arrivalTick: 131 }
              : order.id === "mm-06"
                ? { ...order, arrivalTick: 132 }
                : order.id === "mm-08"
                  ? { ...order, arrivalTick: 219 }
                  : order.id === "mm-09"
                    ? { ...order, arrivalTick: 220 }
                    : order,
          ),
        },
        MIDNIGHT_MERGE.waves[2],
      ],
    };
    const commands: readonly ShiftCommand[] = [
      ...openingBatches,
      { type: "ADVANCE", commandId: "rain-edge-arrivals", ticks: 220 },
    ];
    const state = commands.reduce(
      (current, command) => reduceShift(current, command, edgeFixture),
      createInitialShift(edgeFixture),
    );

    expect(state.orders.find((order) => order.id === "mm-05")?.state).toBe("DISPATCHED");
    expect(state.orders.find((order) => order.id === "mm-06")?.state).toBe("ROUTE_BLOCKED");
    expect(state.orders.find((order) => order.id === "mm-08")?.state).toBe("ROUTE_BLOCKED");
    expect(state.orders.find((order) => order.id === "mm-09")?.state).toBe("DISPATCHED");
  });

  it("conserves every committed batch and reconciles ledger entries", () => {
    const state = reduceAll([...openingBatches, ...settleCommands("conserve")]);
    for (const batch of state.batches) {
      expect(batch.committedQuantity).toBe(
        batch.availableQuantity + batch.allocatedQuantity + batch.retiredQuantity,
      );
    }
    const sum = (kind: string) =>
      state.ledger.entries
        .filter((entry) => entry.kind === kind)
        .reduce((total, entry) => total + entry.amountCents, 0);
    expect(state.ledger.salesCents).toBe(sum("SALE"));
    expect(state.ledger.ingredientCostCents).toBe(sum("INGREDIENT_COST"));
    expect(new Set(state.ledger.entries.map((entry) => entry.id)).size).toBe(
      state.ledger.entries.length,
    );
  });

  it("makes a recovery a bounded cost that cannot be farmed", () => {
    let faulted = reduceAll(openingBatches);
    faulted = reduceShift(faulted, {
      type: "SWITCH",
      commandId: "make-fault",
      gate: "hot-gate",
      destination: "loopback",
    });
    faulted = reduceShift(faulted, { type: "ADVANCE", commandId: "arrive-fault", ticks: 20 });
    const offer = faulted.recoveries[0];
    expect(offer).toBeDefined();
    if (offer === undefined) throw new Error("Expected recovery offer");
    faulted = reduceShift(faulted, {
      type: "RECOVER",
      commandId: "save",
      recoveryId: offer.id,
      action: "LOOPBACK_SAVE",
    });
    const afterRecovery = faulted;
    faulted = reduceShift(faulted, {
      type: "RECOVER",
      commandId: "save-again",
      recoveryId: offer.id,
      action: "LOOPBACK_SAVE",
    });
    const loopbackCost = offer.costs.find((cost) => cost.action === "LOOPBACK_SAVE");
    expect(loopbackCost).toBeDefined();
    expect(faulted.ledger.recoveryCostCents).toBe(loopbackCost?.ledgerCostCents);
    expect(faulted.orders).toEqual(afterRecovery.orders);
  });

  it("applies the selected PULL_FORWARD time and freshness costs to authoritative state", () => {
    let state = reduceAll(openingBatches);
    state = reduceShift(state, {
      type: "SWITCH",
      commandId: "pull-fault",
      gate: "hot-gate",
      destination: "loopback",
    });
    state = reduceShift(state, { type: "ADVANCE", commandId: "pull-arrival", ticks: 20 });
    const offer = state.recoveries[0];
    if (offer === undefined) throw new Error("Expected recovery offer");
    const cost = offer.costs.find((candidate) => candidate.action === "PULL_FORWARD");
    if (cost === undefined) throw new Error("Expected pull-forward cost");
    const beforeTick = state.tick;
    state = reduceShift(state, {
      type: "RECOVER",
      commandId: "pull-forward",
      recoveryId: offer.id,
      action: "PULL_FORWARD",
    });
    const order = state.orders.find((candidate) => candidate.id === offer.orderId);
    expect(state.tick).toBe(beforeTick + cost.timeCostTicks);
    expect(order?.dispatchedAtTick).toBe(state.tick);
    expect(order?.recoveryTimeCostTicks).toBe(cost.timeCostTicks);
    expect(order?.freshnessPenalty).toBe(cost.freshnessCost);
    expect(state.recoveries[0]?.resolvedAction).toBe("PULL_FORWARD");
    expect(state.ledger.recoveryCostCents).toBe(cost.ledgerCostCents);
  });

  it("makes WAITING_COMPONENT PULL_FORWARD complete the missing short batch and order", () => {
    let state = reduceAll([
      { type: "READ", commandId: "waiting-pull-read" },
      { type: "ADVANCE", commandId: "waiting-pull-arrive", ticks: 20 },
    ]);
    const offer = state.recoveries.find((candidate) => candidate.cause === "WAITING_COMPONENT");
    if (offer === undefined) throw new Error("Expected waiting-component recovery");
    state = reduceShift(state, {
      type: "RECOVER",
      commandId: "waiting-pull-recover",
      recoveryId: offer.id,
      action: "PULL_FORWARD",
    });
    const order = state.orders.find((candidate) => candidate.id === offer.orderId);
    expect(order?.state).toBe("RESOLVED_WITH_CARE");
    expect(order?.dispatchedAtTick).toBe(state.tick);
    expect(state.recoveries.find((candidate) => candidate.id === offer.id)?.state).toBe("RESOLVED");
    expect(state.recoveries.some((candidate) => candidate.orderId === offer.orderId && candidate.state === "OFFERED")).toBe(false);
    for (const batch of state.batches) {
      expect(batch.committedQuantity).toBe(
        batch.availableQuantity + batch.allocatedQuantity + batch.retiredQuantity,
      );
    }
    expect(state.ledger.entries.some((entry) => entry.id === `sale:${offer.orderId}`)).toBe(true);
  });

  it("leaves a legitimate component recovery after a route save without inventory", () => {
    let state = reduceAll([
      { type: "READ", commandId: "route-followup-read" },
      { type: "SWITCH", commandId: "route-followup-block", gate: "hot-gate", destination: "loopback" },
      { type: "ADVANCE", commandId: "route-followup-arrive", ticks: 20 },
    ]);
    const routeOffer = state.recoveries.find((candidate) => candidate.cause === "ROUTE_BLOCKED");
    if (routeOffer === undefined) throw new Error("Expected route recovery");
    state = reduceShift(state, {
      type: "RECOVER",
      commandId: "route-followup-pull",
      recoveryId: routeOffer.id,
      action: "PULL_FORWARD",
    });
    const order = state.orders.find((candidate) => candidate.id === routeOffer.orderId);
    const followup = state.recoveries.find(
      (candidate) => candidate.orderId === routeOffer.orderId && candidate.state === "OFFERED",
    );
    expect(order?.state).toBe("WAITING_COMPONENT");
    expect(followup?.cause).toBe("WAITING_COMPONENT");
    expect(followup?.actions).toContain("SHORT_BATCH");
    if (followup === undefined) throw new Error("Expected component follow-up");
    state = reduceShift(state, {
      type: "RECOVER",
      commandId: "route-followup-complete",
      recoveryId: followup.id,
      action: "SHORT_BATCH",
    });
    expect(state.orders.find((candidate) => candidate.id === routeOffer.orderId)?.state).toBe(
      "RESOLVED_WITH_CARE",
    );
  });

  it("clears the steady-eight mm-09 through mm-15 tail without stranded resolved offers", () => {
    const steadyEight: readonly ShiftCommand[] = [
      { type: "READ", commandId: "steady-read" },
      { type: "COMMIT", commandId: "steady-c", batchId: "steady-chicken", component: "chicken", quantity: 8 },
      { type: "COMMIT", commandId: "steady-f", batchId: "steady-fries", component: "waffle-fries", quantity: 8 },
      { type: "COMMIT", commandId: "steady-b", batchId: "steady-biscuits", component: "biscuit", quantity: 8 },
      { type: "COMMIT", commandId: "steady-s", batchId: "steady-slaw", component: "slaw", quantity: 8 },
      { type: "COMMIT", commandId: "steady-d", batchId: "steady-drinks", component: "drink", quantity: 8 },
      { type: "ADVANCE", commandId: "steady-tail", ticks: MIDNIGHT_MERGE.durationTicks },
    ];
    let state = reduceAll(steadyEight);
    let recoveryCount = 0;
    while (true) {
      const offer = state.recoveries.find((candidate) => candidate.state === "OFFERED");
      if (offer === undefined) break;
      recoveryCount += 1;
      if (recoveryCount > 30) throw new Error("Recovery tail did not converge");
      state = reduceShift(state, {
        type: "RECOVER",
        commandId: `steady-recover-${recoveryCount}`,
        recoveryId: offer.id,
        action: "PULL_FORWARD",
      });
    }
    for (const id of ["mm-09", "mm-10", "mm-11", "mm-12", "mm-13", "mm-14", "mm-15"]) {
      expect(["DISPATCHED", "RESOLVED_WITH_CARE"]).toContain(
        state.orders.find((order) => order.id === id)?.state,
      );
    }
    expect(state.orders.every((order) => order.state === "DISPATCHED" || order.state === "RESOLVED_WITH_CARE")).toBe(true);
    expect(state.recoveries.every((offer) => offer.state === "RESOLVED")).toBe(true);
    state = reduceShift(state, { type: "SETTLE", commandId: "steady-settle" });
    expect(state.result?.dispatchedOrders).toBe(state.result?.totalOrders);
  });

  it("never improves score, health, or progression by creating and recovering a fault", () => {
    const clean = reduceAll([...openingBatches, ...settleCommands("clean-compare")]);

    let faulted = reduceAll(openingBatches);
    faulted = reduceShift(faulted, {
      type: "SWITCH",
      commandId: "fault-route",
      gate: "hot-gate",
      destination: "loopback",
    });
    faulted = reduceShift(faulted, { type: "ADVANCE", commandId: "fault-arrive", ticks: 20 });
    const offer = faulted.recoveries[0];
    if (offer === undefined) throw new Error("Expected recovery offer");
    faulted = reduceShift(faulted, {
      type: "RECOVER",
      commandId: "fault-recover",
      recoveryId: offer.id,
      action: "LOOPBACK_SAVE",
    });
    faulted = reduceShift(faulted, {
      type: "SWITCH",
      commandId: "fault-clear",
      gate: "hot-gate",
      destination: "pack-b",
    });
    faulted = reduceShift(faulted, {
      type: "ADVANCE",
      commandId: "fault-finish",
      ticks: MIDNIGHT_MERGE.durationTicks - faulted.tick,
    });
    faulted = reduceShift(faulted, { type: "SETTLE", commandId: "fault-settle" });

    expect(faulted.result?.dispatchedOrders).toBe(clean.result?.dispatchedOrders);
    expect(faulted.result?.serviceSignal ?? 0).toBeLessThanOrEqual(clean.result?.serviceSignal ?? 0);
    expect(faulted.result?.progressionPoints ?? 0).toBeLessThanOrEqual(
      clean.result?.progressionPoints ?? 0,
    );
    expect(faulted.ledger.marginCents).toBeLessThan(clean.ledger.marginCents);
    expect(faulted.result?.health === "HEALTHY_SHIFT" ? 2 : 1).toBeLessThanOrEqual(
      clean.result?.health === "HEALTHY_SHIFT" ? 2 : 1,
    );
  });
});

describe("fail-closed snapshot restoration", () => {
  const liveState = reduceAll([
    ...openingBatches,
    { type: "ADVANCE", commandId: "snapshot-live", ticks: 140 },
  ]);
  const settledState = reduceAll([...openingBatches, ...settleCommands("snapshot-settled")]);

  const corruptions: readonly [string, ShiftState, (snapshot: Record<string, any>) => void][] = [
    ["invalid phase", liveState, (snapshot) => { snapshot.phase = "BROKEN"; }],
    ["non-boolean pause", liveState, (snapshot) => { snapshot.paused = "false"; }],
    ["non-boolean forecast", liveState, (snapshot) => { snapshot.forecastRead = 1; }],
    ["unknown route destination", liveState, (snapshot) => { snapshot.routeBoard.hot = "teleport"; }],
    ["forged route revision", liveState, (snapshot) => { snapshot.routeBoard.revision += 1; }],
    ["tick beyond duration", liveState, (snapshot) => { snapshot.tick = MIDNIGHT_MERGE.durationTicks + 1; }],
    ["phase inconsistent with tick", liveState, (snapshot) => { snapshot.phase = "PLANNING"; }],
    ["non-array orders", liveState, (snapshot) => { snapshot.orders = {}; }],
    ["invalid batch enum", liveState, (snapshot) => { snapshot.batches[0].component = "mystery"; }],
    ["invalid order enum", liveState, (snapshot) => { snapshot.orders[0].state = "VANISHED"; }],
    ["order-fixture mismatch", liveState, (snapshot) => { snapshot.orders[0].mealId = "night-bucket"; }],
    ["transient recovery state", liveState, (snapshot) => { snapshot.orders[0].state = "RECOVERING"; }],
    ["invalid processed command enum", liveState, (snapshot) => { snapshot.processedCommands[0].type = "MINT"; }],
    ["result before settlement", liveState, (snapshot) => { snapshot.result = { serviceSignal: 100 }; }],
    ["tampered settled result", settledState, (snapshot) => { snapshot.result.serviceSignal += 1; }],
    ["settled state with reopened order", settledState, (snapshot) => { snapshot.orders[0].state = "ROUTE_BLOCKED"; }],
    ["paused state without PAUSE history", liveState, (snapshot) => { snapshot.paused = true; }],
    [
      "settled state missing SETTLE history",
      settledState,
      (snapshot) => { snapshot.processedCommands = snapshot.processedCommands.slice(0, -1); },
    ],
    [
      "live state with forged SETTLE history",
      liveState,
      (snapshot) => {
        snapshot.processedCommands.push({
          id: "forged-settle",
          fingerprint: "fs1-0000000000000000",
          type: "SETTLE",
        });
      },
    ],
    [
      "orphan ledger entry",
      liveState,
      (snapshot) => {
        snapshot.ledger.entries.push({
          id: "sale:forged",
          kind: "SALE",
          amountCents: 1,
          tick: snapshot.tick,
          referenceId: "forged",
        });
        snapshot.ledger.salesCents += 1;
        snapshot.ledger.marginCents += 1;
      },
    ],
  ];

  it.each(corruptions)("rejects %s corruption", (_label, state, corrupt) => {
    const snapshot = mutableSnapshot(state);
    corrupt(snapshot);
    expect(() => restoreShift(JSON.stringify(snapshot))).toThrow();
  });
});
