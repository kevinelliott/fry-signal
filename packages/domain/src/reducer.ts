import { canonicalize, deterministicDigest } from "./canonical.js";
import { MIDNIGHT_MERGE } from "./fixture.js";
import type {
  Cents,
  ComponentId,
  CookBatch,
  DestinationId,
  GateId,
  LedgerEntry,
  MealDefinition,
  OrderTicket,
  ProcessedCommand,
  RecoveryAction,
  RecoveryActionCost,
  RecoveryOffer,
  ReplayResult,
  RouteBoard,
  RouteSnapshot,
  ShiftCommand,
  ShiftFixture,
  ShiftLedger,
  ShiftPhase,
  ShiftResult,
  ShiftState,
  Tick,
  WaveDefinition,
} from "./types.js";

const PROTECTED_SHIFT_COST_CENTS = 3_600;
const COMPONENT_COST_CENTS: Readonly<Record<ComponentId, Cents>> = {
  chicken: 260,
  "waffle-fries": 80,
  biscuit: 60,
  slaw: 75,
  drink: 40,
};
const COMPONENT_COOK_TICKS: Readonly<Record<ComponentId, Tick>> = {
  chicken: 8,
  "waffle-fries": 6,
  biscuit: 5,
  slaw: 0,
  drink: 0,
};

function assertInteger(value: number, label: string, minimum = 0): void {
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new Error(`${label} must be a safe integer greater than or equal to ${minimum}`);
  }
}

function assertCommandId(commandId: string): void {
  if (commandId.trim().length === 0 || commandId.length > 128) {
    throw new Error("commandId must contain 1 to 128 characters");
  }
}

function getMeal(fixture: ShiftFixture, mealId: MealDefinition["id"]): MealDefinition {
  const meal = fixture.meals.find((candidate) => candidate.id === mealId);
  if (meal === undefined) {
    throw new Error(`Unknown meal: ${mealId}`);
  }
  return meal;
}

function currentPhase(tick: Tick, fixture: ShiftFixture, forecastRead: boolean): ShiftPhase {
  if (!forecastRead) return "BRIEFING";
  if (tick < fixture.waves[0].startsAtTick) return "PLANNING";
  if (tick >= fixture.durationTicks) return "FINAL_RECOVERY";
  const wave = fixture.waves.find(
    (candidate) => tick >= candidate.startsAtTick && tick <= candidate.endsAtTick,
  );
  if (wave !== undefined) return "WAVE_ACTIVE";
  if (tick > fixture.waves[2].endsAtTick) return "FINAL_RECOVERY";
  return "INTERWAVE";
}

function routeSnapshot(board: RouteBoard): RouteSnapshot {
  return { hot: board.hot, cold: board.cold, drink: board.drink };
}

function ledgerFromEntries(entries: readonly LedgerEntry[]): ShiftLedger {
  let salesCents = 0;
  let ingredientCostCents = 0;
  let recoveryCostCents = 0;
  let retirementCostCents = 0;
  for (const entry of entries) {
    assertInteger(entry.amountCents, `ledger entry ${entry.id}`);
    if (entry.kind === "SALE") salesCents += entry.amountCents;
    if (entry.kind === "INGREDIENT_COST") ingredientCostCents += entry.amountCents;
    if (entry.kind === "RECOVERY_COST") recoveryCostCents += entry.amountCents;
    if (entry.kind === "RETIREMENT_COST") retirementCostCents += entry.amountCents;
  }
  return {
    entries,
    salesCents,
    ingredientCostCents,
    recoveryCostCents,
    retirementCostCents,
    protectedShiftCostCents: PROTECTED_SHIFT_COST_CENTS,
    marginCents:
      salesCents -
      ingredientCostCents -
      recoveryCostCents -
      retirementCostCents -
      PROTECTED_SHIFT_COST_CENTS,
  };
}

function appendLedgerEntry(state: ShiftState, entry: LedgerEntry): ShiftState {
  if (state.ledger.entries.some((candidate) => candidate.id === entry.id)) return state;
  return { ...state, ledger: ledgerFromEntries([...state.ledger.entries, entry]) };
}

function gateSource(gate: GateId): keyof RouteSnapshot {
  if (gate === "hot-gate") return "hot";
  if (gate === "cold-gate") return "cold";
  return "drink";
}

function hasBlockedRoute(route: RouteSnapshot): boolean {
  return route.hot === "loopback" || route.cold === "loopback" || route.drink === "loopback";
}

function offerFor(order: OrderTicket, cause: RecoveryOffer["cause"]): RecoveryOffer {
  const routeBlocked = cause === "ROUTE_BLOCKED";
  const costs: readonly RecoveryActionCost[] = routeBlocked
    ? [
        { action: "LOOPBACK_SAVE", timeCostTicks: 5, freshnessCost: 3, ledgerCostCents: 125 },
        { action: "PULL_FORWARD", timeCostTicks: 7, freshnessCost: 2, ledgerCostCents: 175 },
      ]
    : [
        { action: "SHORT_BATCH", timeCostTicks: 8, freshnessCost: 5, ledgerCostCents: 240 },
        { action: "PULL_FORWARD", timeCostTicks: 10, freshnessCost: 4, ledgerCostCents: 200 },
      ];
  return {
    id: `recovery:${order.id}:${cause.toLowerCase()}`,
    orderId: order.id,
    cause,
    actions: costs.map((cost) => cost.action),
    costs,
    state: "OFFERED",
    resolvedAction: null,
  };
}

function allPlannedOrders(fixture: ShiftFixture): readonly (WaveDefinition["orders"][number] & {
  readonly waveId: WaveDefinition["id"];
})[] {
  return fixture.waves.flatMap((wave) =>
    wave.orders.map((order) => ({ ...order, waveId: wave.id })),
  );
}

function markReadyBatches(batches: readonly CookBatch[], tick: Tick): readonly CookBatch[] {
  return batches.map((batch) =>
    batch.state === "COOKING" && batch.readyAtTick <= tick
      ? { ...batch, state: batch.availableQuantity === 0 ? "DEPLETED" : "AVAILABLE" }
      : batch,
  );
}

function inventoryFor(batches: readonly CookBatch[]): Readonly<Record<ComponentId, number>> {
  const inventory: Record<ComponentId, number> = {
    chicken: 0,
    "waffle-fries": 0,
    biscuit: 0,
    slaw: 0,
    drink: 0,
  };
  for (const batch of batches) {
    if (batch.state === "AVAILABLE") inventory[batch.component] += batch.availableQuantity;
  }
  return inventory;
}

function canAllocate(meal: MealDefinition, batches: readonly CookBatch[]): boolean {
  const inventory = inventoryFor(batches);
  return meal.requirements.every(
    (requirement) => inventory[requirement.component] >= requirement.quantity,
  );
}

function allocateFromBatches(
  batches: readonly CookBatch[],
  meal: MealDefinition,
): readonly CookBatch[] {
  let next = [...batches];
  for (const requirement of meal.requirements) {
    let remaining = requirement.quantity;
    next = next.map((batch) => {
      if (remaining === 0 || batch.component !== requirement.component || batch.state !== "AVAILABLE") {
        return batch;
      }
      const used = Math.min(remaining, batch.availableQuantity);
      remaining -= used;
      const availableQuantity = batch.availableQuantity - used;
      return {
        ...batch,
        availableQuantity,
        allocatedQuantity: batch.allocatedQuantity + used,
        state: availableQuantity === 0 ? "DEPLETED" : "AVAILABLE",
      };
    });
    if (remaining !== 0) throw new Error("Batch allocation violated inventory precondition");
  }
  return next;
}

function dispatchOrder(
  state: ShiftState,
  order: OrderTicket,
  fixture: ShiftFixture,
  recovered: boolean,
): ShiftState {
  if (order.state === "DISPATCHED" || order.state === "RESOLVED_WITH_CARE") return state;
  const meal = getMeal(fixture, order.mealId);
  if (!canAllocate(meal, state.batches)) return state;
  const terminalState = recovered ? "RESOLVED_WITH_CARE" : "DISPATCHED";
  let next: ShiftState = {
    ...state,
    batches: allocateFromBatches(state.batches, meal),
    orders: state.orders.map((candidate) =>
      candidate.id === order.id
        ? {
            ...candidate,
            state: terminalState,
            dispatchedAtTick: state.tick,
            recovered,
          }
        : candidate,
    ),
    recoveries: state.recoveries.map((offer) =>
      offer.orderId === order.id ? { ...offer, state: "RESOLVED" } : offer,
    ),
  };
  next = appendLedgerEntry(next, {
    id: `sale:${order.id}`,
    kind: "SALE",
    amountCents: meal.priceCents,
    tick: state.tick,
    referenceId: order.id,
  });
  return next;
}

function tryDispatchWaiting(state: ShiftState, fixture: ShiftFixture): ShiftState {
  let next = state;
  for (const order of next.orders) {
    if (order.state !== "ARRIVED" && order.state !== "WAITING_COMPONENT") continue;
    if (hasBlockedRoute(order.routeSnapshot)) continue;
    const meal = getMeal(fixture, order.mealId);
    if (canAllocate(meal, next.batches)) {
      next = dispatchOrder(next, order, fixture, order.recovered);
    }
  }
  return next;
}

function arriveOrders(state: ShiftState, fixture: ShiftFixture): ShiftState {
  let next = state;
  const arrivedIds = new Set(next.orders.map((order) => order.id));
  for (const planned of allPlannedOrders(fixture)) {
    if (planned.arrivalTick > next.tick || arrivedIds.has(planned.id)) continue;
    const snapshot = routeSnapshot(next.routeBoard);
    const blocked = hasBlockedRoute(snapshot);
    const ticket: OrderTicket = {
      id: planned.id,
      waveId: planned.waveId,
      lane: planned.lane,
      mealId: planned.mealId,
      arrivedAtTick: planned.arrivalTick,
      routeSnapshot: snapshot,
      state: blocked ? "ROUTE_BLOCKED" : "ARRIVED",
      dispatchedAtTick: null,
      recovered: false,
      recoveryTimeCostTicks: 0,
      freshnessPenalty: 0,
    };
    next = {
      ...next,
      orders: [...next.orders, ticket],
      faultCount: blocked ? next.faultCount + 1 : next.faultCount,
      recoveries: blocked ? [...next.recoveries, offerFor(ticket, "ROUTE_BLOCKED")] : next.recoveries,
    };
    arrivedIds.add(planned.id);
  }
  next = tryDispatchWaiting(next, fixture);
  const existingOfferOrderIds = new Set(next.recoveries.map((offer) => offer.orderId));
  let orders = next.orders;
  let recoveries = next.recoveries;
  for (const order of next.orders) {
    if (order.state !== "ARRIVED" || existingOfferOrderIds.has(order.id)) continue;
    const meal = getMeal(fixture, order.mealId);
    if (!canAllocate(meal, next.batches)) {
      orders = orders.map((candidate) =>
        candidate.id === order.id ? { ...candidate, state: "WAITING_COMPONENT" } : candidate,
      );
      recoveries = [...recoveries, offerFor(order, "WAITING_COMPONENT")];
      existingOfferOrderIds.add(order.id);
    }
  }
  return { ...next, orders, recoveries };
}

function advance(state: ShiftState, ticks: Tick, fixture: ShiftFixture): ShiftState {
  assertInteger(ticks, "ticks", 1);
  if (state.paused || state.phase === "SETTLED") return state;
  let next = state;
  for (let count = 0; count < ticks; count += 1) {
    const tick = Math.min(next.tick + 1, fixture.durationTicks);
    next = {
      ...next,
      tick,
      phase: currentPhase(tick, fixture, next.forecastRead),
      batches: markReadyBatches(next.batches, tick),
    };
    next = arriveOrders(next, fixture);
    if (tick === fixture.durationTicks) break;
  }
  return next;
}

function addShortBatch(state: ShiftState, order: OrderTicket, fixture: ShiftFixture): ShiftState {
  const meal = getMeal(fixture, order.mealId);
  let next = state;
  for (const requirement of meal.requirements) {
    const inventory = inventoryFor(next.batches)[requirement.component];
    const missing = Math.max(0, requirement.quantity - inventory);
    if (missing === 0) continue;
    const id = `short:${order.id}:${requirement.component}`;
    const cost = COMPONENT_COST_CENTS[requirement.component] * missing;
    const batch: CookBatch = {
      id,
      component: requirement.component,
      committedQuantity: missing,
      availableQuantity: missing,
      allocatedQuantity: 0,
      retiredQuantity: 0,
      committedAtTick: state.tick,
      readyAtTick: state.tick,
      state: "AVAILABLE",
    };
    next = { ...next, batches: [...next.batches, batch] };
    next = appendLedgerEntry(next, {
      id: `ingredient:${id}`,
      kind: "INGREDIENT_COST",
      amountCents: cost,
      tick: state.tick,
      referenceId: id,
    });
  }
  return next;
}

function ensureRecoverableOrTerminal(
  state: ShiftState,
  orderId: string,
): ShiftState {
  const order = state.orders.find((candidate) => candidate.id === orderId);
  if (order === undefined) throw new Error(`Recovery order is missing: ${orderId}`);
  if (order.state === "DISPATCHED" || order.state === "RESOLVED_WITH_CARE") return state;
  const openOffer = state.recoveries.find(
    (candidate) => candidate.orderId === orderId && candidate.state === "OFFERED",
  );
  if (openOffer !== undefined) return state;
  if (order.state !== "WAITING_COMPONENT") {
    throw new Error(`Recovery left order in an invalid state: ${orderId}`);
  }
  const followup = offerFor(order, "WAITING_COMPONENT");
  if (state.recoveries.some((candidate) => candidate.id === followup.id)) {
    throw new Error(`Recovery exhausted the available choices for order: ${orderId}`);
  }
  return { ...state, recoveries: [...state.recoveries, followup] };
}

function recover(
  state: ShiftState,
  recoveryId: string,
  action: RecoveryAction,
  fixture: ShiftFixture,
): ShiftState {
  const offer = state.recoveries.find((candidate) => candidate.id === recoveryId);
  if (offer === undefined) throw new Error(`Unknown recovery: ${recoveryId}`);
  if (offer.state === "RESOLVED") return state;
  if (!offer.actions.includes(action)) throw new Error(`Recovery action ${action} is not allowed`);
  const actionCost = offer.costs.find((candidate) => candidate.action === action);
  if (actionCost === undefined) throw new Error(`Recovery action ${action} has no declared cost`);
  const order = state.orders.find((candidate) => candidate.id === offer.orderId);
  if (order === undefined) throw new Error(`Recovery order is missing: ${offer.orderId}`);

  let next: ShiftState = {
    ...state,
    orders: state.orders.map((candidate) =>
      candidate.id === order.id
        ? {
            ...candidate,
            recovered: true,
            recoveryTimeCostTicks: candidate.recoveryTimeCostTicks + actionCost.timeCostTicks,
            freshnessPenalty: candidate.freshnessPenalty + actionCost.freshnessCost,
            state: "RECOVERING",
          }
        : candidate,
    ),
    recoveries: state.recoveries.map((candidate) =>
      candidate.id === offer.id
        ? { ...candidate, state: "RESOLVED", resolvedAction: action }
        : candidate,
    ),
  };
  next = appendLedgerEntry(next, {
    id: `recovery-cost:${offer.id}`,
    kind: "RECOVERY_COST",
    amountCents: actionCost.ledgerCostCents,
    tick: state.tick,
    referenceId: offer.id,
  });
  next = advance(next, actionCost.timeCostTicks, fixture);
  next = {
    ...next,
    orders: next.orders.map((candidate) =>
      candidate.id === order.id
        ? {
            ...candidate,
            routeSnapshot:
              action === "LOOPBACK_SAVE" || action === "PULL_FORWARD"
                ? { ...candidate.routeSnapshot, hot: "pack-a", cold: "pack-a", drink: "pack-a" }
                : candidate.routeSnapshot,
            state: "WAITING_COMPONENT",
          }
        : candidate,
    ),
  };
  const recoveringOrder = next.orders.find((candidate) => candidate.id === order.id);
  if (recoveringOrder === undefined) throw new Error("Recovered order disappeared");
  if (
    action === "SHORT_BATCH" ||
    (offer.cause === "WAITING_COMPONENT" && action === "PULL_FORWARD")
  ) {
    next = addShortBatch(next, recoveringOrder, fixture);
  }
  const updated = next.orders.find((candidate) => candidate.id === order.id);
  if (updated === undefined) throw new Error("Recovered order disappeared");
  next = dispatchOrder(next, updated, fixture, true);
  next = tryDispatchWaiting(next, fixture);
  return ensureRecoverableOrTerminal(next, order.id);
}

function retirementEntries(state: ShiftState): readonly LedgerEntry[] {
  return state.batches
    .filter((batch) => batch.availableQuantity > 0)
    .map((batch) => ({
      id: `retire:${batch.id}`,
      kind: "RETIREMENT_COST" as const,
      amountCents: COMPONENT_COST_CENTS[batch.component] * batch.availableQuantity,
      tick: state.tick,
      referenceId: batch.id,
    }));
}

function scoreResult(state: ShiftState, fixture: ShiftFixture): ShiftResult {
  const totalOrders = allPlannedOrders(fixture).length;
  const dispatched = state.orders.filter(
    (order) => order.state === "DISPATCHED" || order.state === "RESOLVED_WITH_CARE",
  );
  const freshnessPenalty = state.orders.reduce((total, order) => total + order.freshnessPenalty, 0);
  const recoveryTimeCostTicks = state.orders.reduce(
    (total, order) => total + order.recoveryTimeCostTicks,
    0,
  );
  const unresolved = totalOrders - dispatched.length;
  const accuracy = Math.max(0, 100 - unresolved * 12);
  const warmth = Math.max(0, 100 - freshnessPenalty - unresolved * 8);
  const flow = Math.max(0, 100 - Math.ceil(recoveryTimeCostTicks / 2) - unresolved * 10);
  const care = Math.max(0, 100 - state.faultCount * 3 - unresolved * 8);
  const serviceSignal = Math.floor(
    (accuracy * 35 + warmth * 25 + flow * 25 + care * 15) / 100,
  );
  const margin = state.ledger.marginCents;
  const health =
    serviceSignal >= 85 && margin >= 0
      ? "HEALTHY_SHIFT"
      : serviceSignal >= 75
        ? "LOVED_BUT_STRETCHED"
        : "NEEDS_A_RESET";
  return {
    serviceSignal,
    accuracy,
    warmth,
    flow,
    care,
    health,
    progressionPoints: serviceSignal >= 80 ? 1 : 0,
    dispatchedOrders: dispatched.length,
    totalOrders,
  };
}

function settle(state: ShiftState, fixture: ShiftFixture): ShiftState {
  if (state.phase !== "FINAL_RECOVERY" || state.tick !== fixture.durationTicks || state.paused) {
    throw new Error("Shift cannot settle before the final recovery window");
  }
  const entries = [...state.ledger.entries, ...retirementEntries(state)].filter(
    (entry, index, all) => all.findIndex((candidate) => candidate.id === entry.id) === index,
  );
  const batches = state.batches.map((batch) =>
    batch.availableQuantity > 0
      ? {
          ...batch,
          retiredQuantity: batch.retiredQuantity + batch.availableQuantity,
          availableQuantity: 0,
          state: "RETIRED" as const,
        }
      : batch,
  );
  const preResult = { ...state, batches, ledger: ledgerFromEntries(entries) };
  return { ...preResult, phase: "SETTLED", paused: false, result: scoreResult(preResult, fixture) };
}

function applyCommand(state: ShiftState, command: ShiftCommand, fixture: ShiftFixture): ShiftState {
  if (state.phase === "SETTLED") {
    throw new Error("A settled shift is immutable");
  }
  if (command.type === "READ") {
    return {
      ...state,
      forecastRead: true,
      phase: currentPhase(state.tick, fixture, true),
    };
  }
  if (command.type === "COMMIT") {
    if (!state.forecastRead) {
      throw new Error("A batch can be committed only after reading the forecast");
    }
    assertInteger(command.quantity, "quantity", 1);
    if (state.batches.some((batch) => batch.id === command.batchId)) {
      throw new Error(`Batch ID already exists: ${command.batchId}`);
    }
    const batch: CookBatch = {
      id: command.batchId,
      component: command.component,
      committedQuantity: command.quantity,
      availableQuantity: command.quantity,
      allocatedQuantity: 0,
      retiredQuantity: 0,
      committedAtTick: state.tick,
      readyAtTick: state.tick + COMPONENT_COOK_TICKS[command.component],
      state: COMPONENT_COOK_TICKS[command.component] === 0 ? "AVAILABLE" : "COOKING",
    };
    let next: ShiftState = { ...state, batches: [...state.batches, batch] };
    next = appendLedgerEntry(next, {
      id: `ingredient:${command.batchId}`,
      kind: "INGREDIENT_COST",
      amountCents: COMPONENT_COST_CENTS[command.component] * command.quantity,
      tick: state.tick,
      referenceId: command.batchId,
    });
    return tryDispatchWaiting(next, fixture);
  }
  if (command.type === "SWITCH") {
    if (!state.forecastRead) {
      throw new Error("A route can be switched only during an active shift");
    }
    const source = gateSource(command.gate);
    return {
      ...state,
      routeBoard: { ...state.routeBoard, [source]: command.destination, revision: state.routeBoard.revision + 1 },
    };
  }
  if (command.type === "RECOVER") {
    return recover(state, command.recoveryId, command.action, fixture);
  }
  if (command.type === "ADVANCE") {
    if (!state.forecastRead) throw new Error("Time can advance only after reading the forecast");
    return advance(state, command.ticks, fixture);
  }
  if (command.type === "PAUSE") return { ...state, paused: true };
  if (command.type === "RESUME") return { ...state, paused: false };
  return settle(state, fixture);
}

function assertRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function assertArray(value: unknown, label: string): asserts value is readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
}

function assertBoolean(value: unknown, label: string): asserts value is boolean {
  if (typeof value !== "boolean") throw new Error(`${label} must be a boolean`);
}

function assertString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 256) {
    throw new Error(`${label} must contain 1 to 256 characters`);
  }
}

function assertEnum<T extends string>(
  value: unknown,
  values: readonly T[],
  label: string,
): asserts value is T {
  if (typeof value !== "string" || !values.includes(value as T)) {
    throw new Error(`${label} is invalid`);
  }
}

const COMPONENT_IDS = ["chicken", "waffle-fries", "biscuit", "slaw", "drink"] as const;
const DESTINATION_IDS = ["pack-a", "pack-b", "loopback"] as const;
const BATCH_STATES = ["COOKING", "AVAILABLE", "DEPLETED", "RETIRED"] as const;
const ORDER_STATES = [
  "ARRIVED",
  "WAITING_COMPONENT",
  "ROUTE_BLOCKED",
  "RECOVERING",
  "DISPATCHED",
  "RESOLVED_WITH_CARE",
] as const;
const RECOVERY_CAUSES = ["ROUTE_BLOCKED", "WAITING_COMPONENT"] as const;
const RECOVERY_ACTIONS = ["LOOPBACK_SAVE", "PULL_FORWARD", "SHORT_BATCH"] as const;
const COMMAND_TYPES = ["READ", "COMMIT", "SWITCH", "RECOVER", "ADVANCE", "PAUSE", "RESUME", "SETTLE"] as const;
const SHIFT_PHASES = ["BRIEFING", "PLANNING", "WAVE_ACTIVE", "INTERWAVE", "FINAL_RECOVERY", "SETTLED"] as const;
const LEDGER_KINDS = ["INGREDIENT_COST", "SALE", "RECOVERY_COST", "RETIREMENT_COST"] as const;

function validateRouteSnapshot(value: unknown, label: string): asserts value is RouteSnapshot {
  assertRecord(value, label);
  assertEnum(value.hot, DESTINATION_IDS, `${label}.hot`);
  assertEnum(value.cold, DESTINATION_IDS, `${label}.cold`);
  assertEnum(value.drink, DESTINATION_IDS, `${label}.drink`);
}

function validateState(candidate: unknown, fixture: ShiftFixture = MIDNIGHT_MERGE): asserts candidate is ShiftState {
  assertRecord(candidate, "shift snapshot");
  const state = candidate as unknown as ShiftState;
  if (
    state.schemaVersion !== 1 ||
    state.fixtureId !== fixture.id ||
    state.fixtureVersion !== fixture.version ||
    state.rulesVersion !== fixture.rulesVersion
  ) {
    throw new Error("Snapshot version does not match the selected fixture");
  }
  assertInteger(state.tick, "state.tick");
  if (state.tick > fixture.durationTicks) throw new Error("state.tick exceeds shift duration");
  assertEnum(state.phase, SHIFT_PHASES, "state.phase");
  assertBoolean(state.paused, "state.paused");
  assertBoolean(state.forecastRead, "state.forecastRead");
  assertRecord(state.routeBoard, "state.routeBoard");
  validateRouteSnapshot(state.routeBoard, "state.routeBoard");
  assertInteger(state.routeBoard.revision, "state.routeBoard.revision");
  assertArray(state.batches, "state.batches");
  assertArray(state.orders, "state.orders");
  assertArray(state.recoveries, "state.recoveries");
  assertRecord(state.ledger, "state.ledger");
  assertArray(state.ledger.entries, "state.ledger.entries");
  assertInteger(state.faultCount, "state.faultCount");
  assertArray(state.processedCommands, "state.processedCommands");

  const processedIds = new Set<string>();
  for (const [index, item] of state.processedCommands.entries()) {
    assertRecord(item, `processedCommands[${index}]`);
    assertString(item.id, `processedCommands[${index}].id`);
    assertCommandId(item.id);
    assertString(item.fingerprint, `processedCommands[${index}].fingerprint`);
    if (!/^fs1-[0-9a-f]{16}$/.test(item.fingerprint)) {
      throw new Error(`processedCommands[${index}].fingerprint is invalid`);
    }
    assertEnum(item.type, COMMAND_TYPES, `processedCommands[${index}].type`);
    if (processedIds.has(item.id)) throw new Error(`Duplicate processed command: ${item.id}`);
    processedIds.add(item.id);
  }
  const hasRead = state.processedCommands.some((command) => command.type === "READ");
  if (state.forecastRead !== hasRead) throw new Error("Forecast state does not match command history");
  let historyRead = false;
  let historyPaused = false;
  let settleIndex = -1;
  for (const [index, command] of state.processedCommands.entries()) {
    if (command.type === "READ") historyRead = true;
    if (
      !historyRead &&
      (command.type === "COMMIT" ||
        command.type === "SWITCH" ||
        command.type === "RECOVER" ||
        command.type === "ADVANCE" ||
        command.type === "SETTLE")
    ) {
      throw new Error(`Command history performs ${command.type} before READ`);
    }
    if (command.type === "PAUSE") historyPaused = true;
    if (command.type === "RESUME") historyPaused = false;
    if (command.type === "SETTLE") {
      if (settleIndex !== -1) throw new Error("Command history settles more than once");
      settleIndex = index;
      historyPaused = false;
    }
    if (settleIndex !== -1 && index > settleIndex) {
      throw new Error("Command history mutates after settlement");
    }
  }
  if (state.paused !== historyPaused) throw new Error("Pause state does not match command history");
  if (state.phase === "SETTLED") {
    if (settleIndex !== state.processedCommands.length - 1) {
      throw new Error("Settled state is missing its terminal SETTLE command");
    }
  } else if (settleIndex !== -1) {
    throw new Error("Live state contains a SETTLE command");
  }
  const switchCount = state.processedCommands.filter((command) => command.type === "SWITCH").length;
  if (state.routeBoard.revision !== switchCount) {
    throw new Error("Route revision does not match command history");
  }

  if (state.phase === "SETTLED") {
    if (state.tick !== fixture.durationTicks || !state.forecastRead || state.paused || state.result === null) {
      throw new Error("Settled shift lifecycle is inconsistent");
    }
  } else {
    if (state.result !== null) throw new Error("Only a settled shift may contain a result");
    if (state.phase !== currentPhase(state.tick, fixture, state.forecastRead)) {
      throw new Error("Shift phase is inconsistent with tick and forecast state");
    }
  }

  const plannedOrders = allPlannedOrders(fixture);
  const expectedArrivals = plannedOrders.filter((planned) => planned.arrivalTick <= state.tick);
  const plannedById = new Map(plannedOrders.map((planned) => [planned.id, planned]));
  const orderIds = new Set<string>();
  for (const [index, order] of state.orders.entries()) {
    assertRecord(order, `orders[${index}]`);
    assertString(order.id, `orders[${index}].id`);
    if (orderIds.has(order.id)) throw new Error(`Duplicate order: ${order.id}`);
    orderIds.add(order.id);
    const planned = plannedById.get(order.id);
    if (planned === undefined) throw new Error(`Unknown order: ${order.id}`);
    if (
      order.waveId !== planned.waveId ||
      order.lane !== planned.lane ||
      order.mealId !== planned.mealId ||
      order.arrivedAtTick !== planned.arrivalTick
    ) {
      throw new Error(`Order does not match fixture: ${order.id}`);
    }
    validateRouteSnapshot(order.routeSnapshot, `order ${order.id}.routeSnapshot`);
    assertEnum(order.state, ORDER_STATES, `order ${order.id}.state`);
    if (order.state === "RECOVERING") {
      throw new Error(`Snapshot contains an in-progress atomic recovery: ${order.id}`);
    }
    assertBoolean(order.recovered, `order ${order.id}.recovered`);
    assertInteger(order.recoveryTimeCostTicks, `order ${order.id}.recoveryTimeCostTicks`);
    assertInteger(order.freshnessPenalty, `order ${order.id}.freshnessPenalty`);
    const terminal = order.state === "DISPATCHED" || order.state === "RESOLVED_WITH_CARE";
    if (terminal) {
      assertInteger(order.dispatchedAtTick as number, `order ${order.id}.dispatchedAtTick`);
      if (
        order.dispatchedAtTick === null ||
        order.dispatchedAtTick < order.arrivedAtTick ||
        order.dispatchedAtTick > state.tick
      ) {
        throw new Error(`Order dispatch tick is inconsistent: ${order.id}`);
      }
    } else if (order.dispatchedAtTick !== null) {
      throw new Error(`Unresolved order has a dispatch tick: ${order.id}`);
    }
    if (order.state === "DISPATCHED" && order.recovered) {
      throw new Error(`Recovered order has a clean dispatch state: ${order.id}`);
    }
    if (order.state === "RESOLVED_WITH_CARE" && !order.recovered) {
      throw new Error(`Care resolution is missing recovery state: ${order.id}`);
    }
    if (!order.recovered && (order.recoveryTimeCostTicks !== 0 || order.freshnessPenalty !== 0)) {
      throw new Error(`Clean order contains recovery penalties: ${order.id}`);
    }
  }
  if (
    orderIds.size !== expectedArrivals.length ||
    expectedArrivals.some((planned) => !orderIds.has(planned.id))
  ) {
    throw new Error("Arrived orders do not match the authoritative fixture timeline");
  }

  const batchIds = new Set<string>();
  const allocatedByComponent: Record<ComponentId, number> = {
    chicken: 0,
    "waffle-fries": 0,
    biscuit: 0,
    slaw: 0,
    drink: 0,
  };
  for (const [index, batch] of state.batches.entries()) {
    assertRecord(batch, `batches[${index}]`);
    assertString(batch.id, `batches[${index}].id`);
    if (batchIds.has(batch.id)) throw new Error(`Duplicate batch: ${batch.id}`);
    batchIds.add(batch.id);
    assertEnum(batch.component, COMPONENT_IDS, `batch ${batch.id}.component`);
    for (const field of ["committedQuantity", "availableQuantity", "allocatedQuantity", "retiredQuantity"] as const) {
      assertInteger(batch[field], `batch ${batch.id}.${field}`);
    }
    assertInteger(batch.committedAtTick, `batch ${batch.id}.committedAtTick`);
    assertInteger(batch.readyAtTick, `batch ${batch.id}.readyAtTick`);
    assertEnum(batch.state, BATCH_STATES, `batch ${batch.id}.state`);
    if (batch.committedAtTick > state.tick || batch.readyAtTick < batch.committedAtTick) {
      throw new Error(`Batch timing is inconsistent: ${batch.id}`);
    }
    if (
      batch.committedQuantity !==
      batch.availableQuantity + batch.allocatedQuantity + batch.retiredQuantity
    ) {
      throw new Error(`Batch conservation failed: ${batch.id}`);
    }
    if (batch.state === "AVAILABLE" && (batch.readyAtTick > state.tick || batch.availableQuantity === 0)) {
      throw new Error(`Available batch state is inconsistent: ${batch.id}`);
    }
    if (batch.state === "COOKING" && batch.readyAtTick <= state.tick) {
      throw new Error(`Cooking batch should already be ready: ${batch.id}`);
    }
    if ((batch.state === "DEPLETED" || batch.state === "RETIRED") && batch.availableQuantity !== 0) {
      throw new Error(`Terminal batch still has available inventory: ${batch.id}`);
    }
    if (batch.state === "RETIRED" && state.phase !== "SETTLED") {
      throw new Error(`Batch retired before settlement: ${batch.id}`);
    }
    if (state.phase !== "SETTLED" && batch.retiredQuantity !== 0) {
      throw new Error(`Batch has retired inventory before settlement: ${batch.id}`);
    }
    if (batch.state === "RETIRED" && batch.retiredQuantity === 0) {
      throw new Error(`Retired batch has no retired inventory: ${batch.id}`);
    }
    allocatedByComponent[batch.component] += batch.allocatedQuantity;
  }
  const expectedAllocated: Record<ComponentId, number> = {
    chicken: 0,
    "waffle-fries": 0,
    biscuit: 0,
    slaw: 0,
    drink: 0,
  };
  for (const order of state.orders) {
    if (order.state !== "DISPATCHED" && order.state !== "RESOLVED_WITH_CARE") continue;
    for (const requirement of getMeal(fixture, order.mealId).requirements) {
      expectedAllocated[requirement.component] += requirement.quantity;
    }
  }
  if (canonicalize(allocatedByComponent) !== canonicalize(expectedAllocated)) {
    throw new Error("Batch allocations do not match dispatched orders");
  }

  const recoveryIds = new Set<string>();
  const resolvedCostsByOrder = new Map<string, { time: number; freshness: number }>();
  for (const [index, recovery] of state.recoveries.entries()) {
    assertRecord(recovery, `recoveries[${index}]`);
    assertString(recovery.id, `recoveries[${index}].id`);
    assertString(recovery.orderId, `recoveries[${index}].orderId`);
    if (recoveryIds.has(recovery.id)) throw new Error(`Duplicate recovery: ${recovery.id}`);
    recoveryIds.add(recovery.id);
    const order = state.orders.find((candidate) => candidate.id === recovery.orderId);
    if (order === undefined) throw new Error(`Recovery references missing order: ${recovery.id}`);
    assertEnum(recovery.cause, RECOVERY_CAUSES, `recovery ${recovery.id}.cause`);
    assertArray(recovery.actions, `recovery ${recovery.id}.actions`);
    recovery.actions.forEach((action, actionIndex) =>
      assertEnum(action, RECOVERY_ACTIONS, `recovery ${recovery.id}.actions[${actionIndex}]`),
    );
    assertArray(recovery.costs, `recovery ${recovery.id}.costs`);
    for (const [costIndex, cost] of recovery.costs.entries()) {
      assertRecord(cost, `recovery ${recovery.id}.costs[${costIndex}]`);
      assertEnum(cost.action, RECOVERY_ACTIONS, `recovery ${recovery.id}.costs[${costIndex}].action`);
      assertInteger(cost.timeCostTicks, `recovery ${recovery.id}.costs[${costIndex}].timeCostTicks`, 1);
      assertInteger(cost.freshnessCost, `recovery ${recovery.id}.costs[${costIndex}].freshnessCost`, 1);
      assertInteger(cost.ledgerCostCents, `recovery ${recovery.id}.costs[${costIndex}].ledgerCostCents`, 1);
    }
    const expected = offerFor(order, recovery.cause);
    if (
      recovery.id !== expected.id ||
      canonicalize(recovery.actions) !== canonicalize(expected.actions) ||
      canonicalize(recovery.costs) !== canonicalize(expected.costs)
    ) {
      throw new Error(`Recovery terms do not match policy: ${recovery.id}`);
    }
    if (recovery.state !== "OFFERED" && recovery.state !== "RESOLVED") {
      throw new Error(`Recovery state is invalid: ${recovery.id}`);
    }
    if (recovery.state === "OFFERED") {
      if (recovery.resolvedAction !== null) throw new Error(`Open recovery has a resolution: ${recovery.id}`);
      if (order.state !== recovery.cause) {
        throw new Error(`Open recovery does not match order state: ${recovery.id}`);
      }
    } else {
      assertEnum(recovery.resolvedAction, RECOVERY_ACTIONS, `recovery ${recovery.id}.resolvedAction`);
      const cost = expected.costs.find((candidateCost) => candidateCost.action === recovery.resolvedAction);
      if (cost === undefined) throw new Error(`Recovery resolution is not allowed: ${recovery.id}`);
      const totals = resolvedCostsByOrder.get(order.id) ?? { time: 0, freshness: 0 };
      totals.time += cost.timeCostTicks;
      totals.freshness += cost.freshnessCost;
      resolvedCostsByOrder.set(order.id, totals);
    }
  }
  for (const order of state.orders) {
    const costs = resolvedCostsByOrder.get(order.id) ?? { time: 0, freshness: 0 };
    if (
      order.recovered !== (costs.time > 0) ||
      order.recoveryTimeCostTicks !== costs.time ||
      order.freshnessPenalty !== costs.freshness
    ) {
      throw new Error(`Order recovery costs do not reconcile: ${order.id}`);
    }
  }
  if (state.faultCount !== state.recoveries.filter((recovery) => recovery.cause === "ROUTE_BLOCKED").length) {
    throw new Error("Fault count does not match route-blocked recoveries");
  }

  const entryIds = new Set<string>();
  for (const [index, entry] of state.ledger.entries.entries()) {
    assertRecord(entry, `ledger.entries[${index}]`);
    assertString(entry.id, `ledger.entries[${index}].id`);
    assertEnum(entry.kind, LEDGER_KINDS, `ledger entry ${entry.id}.kind`);
    assertInteger(entry.amountCents, `ledger entry ${entry.id}.amountCents`);
    assertInteger(entry.tick, `ledger entry ${entry.id}.tick`);
    assertString(entry.referenceId, `ledger entry ${entry.id}.referenceId`);
    if (entry.tick > state.tick) throw new Error(`Ledger entry is from the future: ${entry.id}`);
    if (entryIds.has(entry.id)) throw new Error(`Duplicate ledger entry: ${entry.id}`);
    entryIds.add(entry.id);
  }
  for (const batch of state.batches) {
    const entry = state.ledger.entries.find((candidateEntry) => candidateEntry.id === `ingredient:${batch.id}`);
    const expectedAmount = COMPONENT_COST_CENTS[batch.component] * batch.committedQuantity;
    if (entry?.kind !== "INGREDIENT_COST" || entry.referenceId !== batch.id || entry.amountCents !== expectedAmount) {
      throw new Error(`Batch ingredient entry is inconsistent: ${batch.id}`);
    }
  }
  for (const order of state.orders) {
    const sale = state.ledger.entries.find((entry) => entry.id === `sale:${order.id}`);
    const terminal = order.state === "DISPATCHED" || order.state === "RESOLVED_WITH_CARE";
    if (terminal) {
      if (sale?.kind !== "SALE" || sale.referenceId !== order.id || sale.amountCents !== getMeal(fixture, order.mealId).priceCents) {
        throw new Error(`Order sale entry is inconsistent: ${order.id}`);
      }
    } else if (sale !== undefined) {
      throw new Error(`Unresolved order has a sale entry: ${order.id}`);
    }
  }
  for (const recovery of state.recoveries) {
    const entry = state.ledger.entries.find((candidateEntry) => candidateEntry.id === `recovery-cost:${recovery.id}`);
    if (recovery.state === "RESOLVED") {
      const expectedCost = recovery.costs.find((cost) => cost.action === recovery.resolvedAction);
      if (entry?.kind !== "RECOVERY_COST" || entry.referenceId !== recovery.id || entry.amountCents !== expectedCost?.ledgerCostCents) {
        throw new Error(`Recovery ledger entry is inconsistent: ${recovery.id}`);
      }
    } else if (entry !== undefined) {
      throw new Error(`Open recovery has a ledger cost: ${recovery.id}`);
    }
  }
  for (const batch of state.batches) {
    const retirement = state.ledger.entries.find((entry) => entry.id === `retire:${batch.id}`);
    if (batch.retiredQuantity > 0) {
      if (
        retirement?.kind !== "RETIREMENT_COST" ||
        retirement.referenceId !== batch.id ||
        retirement.amountCents !== COMPONENT_COST_CENTS[batch.component] * batch.retiredQuantity
      ) {
        throw new Error(`Batch retirement entry is inconsistent: ${batch.id}`);
      }
    } else if (retirement !== undefined) {
      throw new Error(`Active batch has a retirement entry: ${batch.id}`);
    }
  }
  const expectedEntryIds = new Set<string>([
    ...state.batches.map((batch) => `ingredient:${batch.id}`),
    ...state.batches.filter((batch) => batch.retiredQuantity > 0).map((batch) => `retire:${batch.id}`),
    ...state.orders
      .filter((order) => order.state === "DISPATCHED" || order.state === "RESOLVED_WITH_CARE")
      .map((order) => `sale:${order.id}`),
    ...state.recoveries
      .filter((recovery) => recovery.state === "RESOLVED")
      .map((recovery) => `recovery-cost:${recovery.id}`),
  ]);
  if (
    entryIds.size !== expectedEntryIds.size ||
    [...entryIds].some((entryId) => !expectedEntryIds.has(entryId))
  ) {
    throw new Error("Ledger contains an unexpected or missing entry");
  }
  const recalculated = ledgerFromEntries(state.ledger.entries);
  if (canonicalize(recalculated) !== canonicalize(state.ledger)) {
    throw new Error("Ledger totals do not reconcile with entries");
  }

  if (state.phase === "SETTLED") {
    assertRecord(state.result, "state.result");
    const expectedResult = scoreResult(state, fixture);
    if (canonicalize(state.result) !== canonicalize(expectedResult)) {
      throw new Error("Settled result does not match authoritative state");
    }
  }
}

export function createInitialShift(fixture: ShiftFixture = MIDNIGHT_MERGE): ShiftState {
  if (fixture.waves.length !== 3) throw new Error("Phase 1 requires exactly three waves");
  return {
    schemaVersion: 1,
    fixtureId: fixture.id,
    fixtureVersion: fixture.version,
    rulesVersion: fixture.rulesVersion,
    tick: 0,
    phase: "BRIEFING",
    paused: false,
    forecastRead: false,
    routeBoard: { hot: "pack-a", cold: "pack-a", drink: "pack-a", revision: 0 },
    batches: [],
    orders: [],
    recoveries: [],
    ledger: ledgerFromEntries([]),
    faultCount: 0,
    processedCommands: [],
    result: null,
  };
}

export function reduceShift(
  state: ShiftState,
  command: ShiftCommand,
  fixture: ShiftFixture = MIDNIGHT_MERGE,
): ShiftState {
  assertCommandId(command.commandId);
  if (
    state.fixtureId !== fixture.id ||
    state.fixtureVersion !== fixture.version ||
    state.rulesVersion !== fixture.rulesVersion
  ) {
    throw new Error("State and fixture versions do not match");
  }
  const fingerprint = deterministicDigest(command);
  const existing = state.processedCommands.find((item) => item.id === command.commandId);
  if (existing !== undefined) {
    if (existing.fingerprint !== fingerprint) {
      throw new Error(`Command ID ${command.commandId} was reused with a different payload`);
    }
    return state;
  }
  const applied = applyCommand(state, command, fixture);
  const processed: ProcessedCommand = { id: command.commandId, fingerprint, type: command.type };
  const next = { ...applied, processedCommands: [...applied.processedCommands, processed] };
  validateState(next, fixture);
  return next;
}

export function replayShift(
  commands: readonly ShiftCommand[],
  fixture: ShiftFixture = MIDNIGHT_MERGE,
): ReplayResult {
  let state = createInitialShift(fixture);
  for (const command of commands) state = reduceShift(state, command, fixture);
  return {
    state,
    commands: [...commands],
    digest: deterministicDigest({ fixture: fixture.id, version: fixture.version, commands, state }),
  };
}

export function serializeShift(state: ShiftState): string {
  validateState(state);
  return canonicalize(state);
}

export function restoreShift(serialized: string, fixture: ShiftFixture = MIDNIGHT_MERGE): ShiftState {
  const parsed: unknown = JSON.parse(serialized);
  if (parsed === null || typeof parsed !== "object") throw new Error("Invalid shift snapshot");
  const state = parsed as ShiftState;
  if (
    state.schemaVersion !== 1 ||
    state.fixtureId !== fixture.id ||
    state.fixtureVersion !== fixture.version ||
    state.rulesVersion !== fixture.rulesVersion
  ) {
    throw new Error("Snapshot version does not match the selected fixture");
  }
  validateState(state, fixture);
  return state;
}
