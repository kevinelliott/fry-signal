"use client";

import {
  MIDNIGHT_MERGE,
  createInitialShift,
  reduceShift,
  restoreShift,
  serializeShift,
  type RecoveryAction,
  type RecoveryOffer,
  type ShiftCommand,
  type ShiftState,
  type WaveDefinition,
} from "@fry-signal/domain";
import { useEffect, useMemo, useState } from "react";

type WaveVisual = {
  cue: string;
  weather: string;
  shapes: Array<"circle" | "triangle" | "square">;
  vehicles: Array<"car" | "suv" | "truck">;
};

type GateId = "GATE A" | "GATE B";
const SNAPSHOT_KEY = `fry-signal:${MIDNIGHT_MERGE.id}:fixture-${MIDNIGHT_MERGE.version}:rules-${MIDNIGHT_MERGE.rulesVersion}`;

const waveVisuals: Readonly<Record<WaveDefinition["id"], WaveVisual>> = {
  "commuter-drift": {
    cue: "OPENING WAVE",
    weather: "Clear lanes",
    shapes: ["circle", "circle", "square"],
    vehicles: ["car", "car", "suv"],
  },
  "rain-detour": {
    cue: "WET CROSSOVER · 15 TICK LEAD",
    weather: "Warm rain",
    shapes: ["triangle", "square", "circle"],
    vehicles: ["suv", "car", "truck"],
  },
  "arena-let-out": {
    cue: "DENSE, THEN CLEAR",
    weather: "Stadium lights",
    shapes: ["square", "circle", "triangle"],
    vehicles: ["truck", "suv", "car"],
  },
};

const mealById = new Map(MIDNIGHT_MERGE.meals.map((meal) => [meal.id, meal]));

function formatTick(tick: number) {
  const minutes = Math.floor(tick / 60);
  const seconds = tick % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function mealLabels(wave: WaveDefinition) {
  return wave.forecast.dominantMeals
    .map((mealId) => mealById.get(mealId)?.label ?? mealId)
    .join(" + ");
}

function causeCopy(cause: RecoveryOffer["cause"]) {
  if (cause === "ROUTE_BLOCKED") {
    return {
      label: "Route blocked",
      detail: "This order captured a crossover route. Choose one of the offered ways to restore flow.",
    };
  }
  return {
    label: "Waiting for components",
    detail: "This order reached packout without enough ready stock. Choose one of the offered care actions.",
  };
}

function actionCopy(action: RecoveryAction) {
  if (action === "LOOPBACK_SAVE") return { label: "Loopback Save", help: "Bend this bag back toward packout" };
  if (action === "PULL_FORWARD") return { label: "Pull Forward", help: "Clear the lane while the order is cared for" };
  return { label: "Short Batch", help: "Cook only the missing components" };
}

function shapeForMeal(mealId: string): WaveVisual["shapes"][number] {
  if (mealId === "biscuit-basket") return "square";
  if (mealId === "night-bucket") return "triangle";
  return "circle";
}

function SignalIcon({ kind }: { kind: "batch" | "pack" | "go" }) {
  if (kind === "batch") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 9h14l-1.5 9h-11L5 9Z" />
        <path d="m8 9 2-5m6 5-2-5M8 13h8m-7 3h6" />
      </svg>
    );
  }
  if (kind === "pack") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 7h12l-1 13H7L6 7Z" />
        <path d="M9 7V4h6v3m-6 5 6 5m0-5-6 5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12h13m-5-5 5 5-5 5" />
      <path d="M19 6v12" />
    </svg>
  );
}

function UtilityIcon({ kind }: { kind: "spark" | "steam" | "snow" | "loop" | "rescue" | "bend" | "play" | "pause" }) {
  if (kind === "spark") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 2v28M2 16h28M6 6l20 20M26 6 6 26" />
        <circle cx="16" cy="16" r="3" />
      </svg>
    );
  }
  if (kind === "steam") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 20c-3-4 4-5 0-9s3-5 2-8M15 20c-3-4 4-5 0-9s3-5 2-8" />
      </svg>
    );
  }
  if (kind === "snow") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4 1-1-4m13 7-4-1 1 4M4 14l4-1-1 4m13-7-4 1 1-4" />
      </svg>
    );
  }
  if (kind === "loop") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 8h9a5 5 0 0 1 0 10H9" />
        <path d="m7 4-4 4 4 4" />
      </svg>
    );
  }
  if (kind === "rescue") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 2 8 5v7c0 4-3 7-8 8-5-1-8-4-8-8V7l8-5Z" />
        <path d="M12 7v10M7 12h10" />
      </svg>
    );
  }
  if (kind === "bend") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5h7a6 6 0 0 1 6 6v7" />
        <path d="m13 15 4 4 4-4" />
      </svg>
    );
  }
  if (kind === "play") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path className="is-fill" d="m7 4 13 8L7 20Z" /></svg>;
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path className="is-fill" d="M6 4h4v16H6zM14 4h4v16h-4z" />
    </svg>
  );
}

function VehicleIcon({ type = "car" }: { type?: "car" | "suv" | "truck" }) {
  return (
    <svg className={`vehicle-icon is-${type}`} viewBox="0 0 72 32" shapeRendering="crispEdges" aria-hidden="true">
      {type === "truck" ? (
        <>
          <rect x="4" y="8" width="38" height="16" />
          <path d="M42 14h16l8 10H42z" />
          <rect className="vehicle-window" x="49" y="16" width="9" height="5" />
        </>
      ) : type === "suv" ? (
        <>
          <path d="M7 11h10l6-6h29l8 7h6v12H7z" />
          <rect className="vehicle-window" x="25" y="8" width="10" height="6" />
          <rect className="vehicle-window" x="38" y="8" width="11" height="6" />
        </>
      ) : (
        <>
          <path d="M7 14h9l8-8h23l10 8h8v10H7z" />
          <rect className="vehicle-window" x="27" y="9" width="9" height="5" />
          <path className="vehicle-window" d="M40 9h6l7 5H40z" />
        </>
      )}
      <rect x="14" y="23" width="11" height="5" />
      <rect x={type === "truck" ? 51 : 50} y="23" width="11" height="5" />
      <rect className="vehicle-tire" x="17" y="25" width="6" height="5" />
      <rect className="vehicle-tire" x={type === "truck" ? 54 : 53} y="25" width="6" height="5" />
    </svg>
  );
}

function Shape({ kind }: { kind: WaveVisual["shapes"][number] }) {
  return <span className={`order-shape ${kind}`} aria-label={`${kind} order marker`} />;
}

function SignalMarquee({ activeStage }: { activeStage: number }) {
  const stages = [
    { label: "Batch", kind: "batch" as const },
    { label: "Pack", kind: "pack" as const },
    { label: "Go", kind: "go" as const },
  ];
  return (
    <div className="signal-marquee" aria-label="Service signal: batch, pack, go">
      {stages.map((stage, index) => (
        <div className={`signal-stage ${index <= activeStage ? "is-lit" : ""}`} key={stage.label}>
          <span className="signal-lamp"><SignalIcon kind={stage.kind} /></span>
          <span>{stage.label}</span>
        </div>
      ))}
    </div>
  );
}

function ForecastPanel({ viewedWave, currentWave, onRead }: { viewedWave: number; currentWave: number; onRead: (index: number) => void }) {
  const selectedWave = MIDNIGHT_MERGE.waves[viewedWave] ?? MIDNIGHT_MERGE.waves[0];
  return (
    <aside className="forecast-panel" aria-labelledby="forecast-title">
      <div className="panel-title-row">
        <h2 id="forecast-title">Road forecast</h2>
        <span className="weather-chip">3 waves announced</span>
      </div>
      <div className="forecast-stack">
        {MIDNIGHT_MERGE.waves.map((wave, index) => {
          const visual = waveVisuals[wave.id];
          const range = `${wave.forecast.minimumOrders}–${wave.forecast.maximumOrders} orders`;
          return (
          <button
            className={`wave-ticket ${viewedWave === index ? "is-active" : ""}`}
            key={wave.id}
            onClick={() => onRead(index)}
            aria-pressed={viewedWave === index}
            aria-label={`Read road forecast: ${wave.label}, starts ${formatTick(wave.startsAtTick)}, ${range}${wave.announcedConstraint ? `, ${wave.announcedConstraint}` : ""}`}
          >
            <span className="wave-index">{index + 1}</span>
            <span className="wave-copy">
              <strong>{wave.label}</strong>
              <span>{formatTick(wave.startsAtTick)} · {range}</span>
              <span>{mealLabels(wave)}</span>
            </span>
            <span className="wave-shapes" aria-label="Order mix markers">
              {visual.shapes.map((shape, shapeIndex) => <Shape key={`${shape}-${shapeIndex}`} kind={shape} />)}
            </span>
            <span className="wave-vehicles" aria-label="Forecast vehicle silhouettes">
              {visual.vehicles.map((vehicle, vehicleIndex) => <VehicleIcon key={`${vehicle}-${vehicleIndex}`} type={vehicle} />)}
            </span>
            <span className="wave-cue">{index === currentWave ? "CURRENT · " : ""}{visual.cue}</span>
          </button>
        )})}
      </div>
      <div className="decision-window">
        <span>Viewed forecast</span>
        <strong>{formatTick(selectedWave.startsAtTick)}</strong>
        <span>{waveVisuals[selectedWave.id].weather} · {selectedWave.announcedConstraint ?? "No announced route constraint"}</span>
      </div>
    </aside>
  );
}

function MobileForecast({
  viewedWave,
  currentWave,
  expanded,
  onToggle,
  onRead,
}: {
  viewedWave: number;
  currentWave: number;
  expanded: boolean;
  onToggle: () => void;
  onRead: (index: number) => void;
}) {
  const selectedWave = MIDNIGHT_MERGE.waves[viewedWave] ?? MIDNIGHT_MERGE.waves[0];
  return (
    <div className="mobile-wave mobile-forecast">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="mobile-road-forecast"
        aria-label={`${expanded ? "Close" : "Open"} three-wave road forecast`}
        onClick={onToggle}
        className="mobile-forecast-toggle"
      >
        <span>Viewing wave {viewedWave + 1} · current {currentWave + 1}</span>
        <strong>{selectedWave.label}</strong>
        <span>{expanded ? "Close" : "All waves"}</span>
      </button>
      <span>{formatTick(selectedWave.startsAtTick)} · {selectedWave.forecast.minimumOrders}–{selectedWave.forecast.maximumOrders} orders</span>
      <span>{waveVisuals[selectedWave.id].cue}{selectedWave.announcedConstraint ? ` · ${selectedWave.announcedConstraint}` : ""}</span>
      <div
        id="mobile-road-forecast"
        role="region"
        aria-label="Three announced traffic waves"
        hidden={!expanded}
        className="mobile-forecast-drawer"
      >
        {MIDNIGHT_MERGE.waves.map((wave, index) => (
          <button
            type="button"
            key={wave.id}
            aria-label={`Read mobile forecast wave ${index + 1}: ${wave.label}`}
            aria-pressed={viewedWave === index}
            onClick={() => onRead(index)}
            className="mobile-forecast-option"
          >
            <strong>{index + 1}</strong>
            <span className="mobile-forecast-copy"><strong>{wave.label}</strong><span>{mealLabels(wave)}</span></span>
            <span>{formatTick(wave.startsAtTick)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RouteBoard({
  activeGate,
  onGate,
  focusWave,
  focusIsUpcoming,
  shift,
  offer,
  canSwitch,
}: {
  activeGate: GateId;
  onGate: (gate: GateId) => void;
  focusWave: number;
  focusIsUpcoming: boolean;
  shift: ShiftState;
  offer: RecoveryOffer | null;
  canSwitch: boolean;
}) {
  const selectedWave = MIDNIGHT_MERGE.waves[focusWave] ?? MIDNIGHT_MERGE.waves[0];
  const modifier = selectedWave.topologyModifier;
  const routeNeedsAttention =
    modifier !== null && shift.routeBoard[modifier.source] === modifier.blockedDestination;
  const relatedOrder = offer ? shift.orders.find((order) => order.id === offer.orderId) : undefined;
  const relatedMeal = relatedOrder ? mealById.get(relatedOrder.mealId) : undefined;
  const resolvedAction = offer?.resolvedAction ?? null;
  const routeLabel = relatedOrder && resolvedAction
    ? `${relatedOrder.id} ${relatedMeal?.label ?? relatedOrder.mealId} resolved with ${actionCopy(resolvedAction).label}`
      : relatedOrder
        ? `${relatedOrder.id} ${relatedMeal?.label ?? relatedOrder.mealId} is ${causeCopy(offer!.cause).label.toLowerCase()}`
        : modifier && routeNeedsAttention
          ? `${selectedWave.label}: Gate A is closed to new hot trays. Switch Gate B before the next arrival.`
          : modifier
            ? `${selectedWave.label}: hot trays are set to the safe Pack B crossover.`
      : `Ghost route preview from hot hold through ${activeGate} to automatic packout`;
  const inventory = (component: string) => shift.batches
    .filter((batch) => batch.component === component && batch.state === "AVAILABLE")
    .reduce((total, batch) => total + batch.availableQuantity, 0);
  const recentOrders = [...shift.orders].slice(-3);

  return (
    <section className="route-board" aria-labelledby="route-title">
      <div className="board-heading">
        <div>
          <h2 id="route-title">Signal board</h2>
          <p>{focusIsUpcoming ? "Next decision" : "Current"}: {selectedWave.label} · {waveVisuals[selectedWave.id].cue}</p>
        </div>
        <span className={`mode-label ${routeNeedsAttention ? "is-warning" : modifier ? "is-safe" : ""}`}>
          <span className="pulse-dot" />
          {routeNeedsAttention ? "Detour needs Gate B" : modifier ? "Detour covered" : "Preview ready"}
        </span>
      </div>

      <div className="network" role="group" aria-label={routeLabel}>
        <svg className="track-map" viewBox="0 0 820 510" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <pattern id="ties" width="18" height="18" patternUnits="userSpaceOnUse">
              <rect width="9" height="18" fill="#d3bea0" opacity=".7" />
            </pattern>
            <pattern id="rail-material" width="240" height="42" patternUnits="userSpaceOnUse">
              <image href="/materials/dimensional-track.webp" width="240" height="42" preserveAspectRatio="none" />
            </pattern>
          </defs>
          <g className="track-underlay">
            <path d="M90 90 H260 Q315 90 315 145 V185 H545 Q620 185 620 240 H755" />
            <path d="M90 205 H245 Q300 205 300 260 V320 H545 Q620 320 620 275 V240" />
            <path d="M90 320 H245 Q300 320 300 370 H575 Q640 370 640 420 H755" />
            <path d="M90 430 H250 Q330 430 330 370" />
            <path d="M545 185 C730 80 730 285 590 265 C530 255 525 215 545 185" />
            <path d="M575 370 H655 V420" />
          </g>
          <g className="track-fill">
            <path d="M90 90 H260 Q315 90 315 145 V185 H545 Q620 185 620 240 H755" />
            <path d="M90 205 H245 Q300 205 300 260 V320 H545 Q620 320 620 275 V240" />
            <path d="M90 320 H245 Q300 320 300 370 H575 Q640 370 640 420 H755" />
            <path d="M90 430 H250 Q330 430 330 370" />
            <path d="M545 185 C730 80 730 285 590 265 C530 255 525 215 545 185" />
            <path d="M575 370 H655 V420" />
          </g>
          <path
            className={`ghost-route ${resolvedAction ? "is-committed" : ""}`}
            d={resolvedAction === "LOOPBACK_SAVE"
              ? "M120 205 H245 Q300 205 300 260 V320 H545 C730 320 730 120 590 120 C520 120 520 185 545 185 Q620 185 620 240 H755"
              : resolvedAction === "PULL_FORWARD"
                ? "M120 205 H245 Q300 205 300 260 V320 H575 V370 H655 V420 H755"
                : activeGate === "GATE A"
                  ? "M120 205 H245 Q300 205 300 260 V320 H545 Q620 320 620 275 V240 H755"
                  : "M120 205 H245 Q300 205 300 260 V320 H575 Q640 370 640 420 H755"}
          />
        </svg>

        <div className="source source-fryer"><SignalIcon kind="batch" /><span>Fryer</span><small>{inventory("chicken")} chicken</small></div>
        <div className="source source-hot"><span className="source-icon"><UtilityIcon kind="steam" /></span><span>Hot</span><small>{inventory("waffle-fries") + inventory("biscuit")} ready</small></div>
        <div className="source source-cold"><span className="source-icon"><UtilityIcon kind="snow" /></span><span>Cold</span><small>{inventory("slaw")} slaw</small></div>
        <div className="source source-drink"><span className="cup" aria-hidden="true" /><span>Drink</span><small>{inventory("drink")} ready</small></div>

        <button
          className={`gate gate-a ${activeGate === "GATE A" ? "is-selected" : ""}`}
          onClick={() => onGate("GATE A")}
          aria-pressed={activeGate === "GATE A"}
          aria-label="Switch Gate A toward Pack A and Window 1"
          disabled={!canSwitch}
        >
          <span className="lever" />
          <span>Gate A</span>
        </button>
        <button
          className={`gate gate-b ${activeGate === "GATE B" ? "is-selected" : ""}`}
          onClick={() => onGate("GATE B")}
          aria-pressed={activeGate === "GATE B"}
          aria-label="Switch Gate B toward Pack B and Window 2"
          disabled={!canSwitch}
        >
          <span className="lever" />
          <span>Gate B</span>
        </button>

        {recentOrders.map((order, index) => {
          const meal = mealById.get(order.mealId);
          return (
            <div
              className={`travel-bag bag-${["one", "two", "three"][index]} ${order.id === relatedOrder?.id && resolvedAction ? "is-moving" : ""}`}
              aria-label={`${order.id}, ${meal?.label ?? order.mealId}, ${order.state.toLowerCase().replaceAll("_", " ")}`}
              key={order.id}
            >
              <span className="bag-fold" />
              <strong>{order.id.replace("mm-", "")}</strong>
              <Shape kind={shapeForMeal(order.mealId)} />
            </div>
          );
        })}

        <div className="route-feature loopback-feature"><span><UtilityIcon kind="loop" /></span><strong>Loopback</strong><small>+5 ticks · −3 freshness</small></div>
        <div className="route-feature rescue-feature"><span><UtilityIcon kind="rescue" /></span><strong>Rescue spur</strong><small>Frees the main line</small></div>
        <div className="window window-one"><span>Window</span><strong>1</strong><small>Lane A</small></div>
        <div className="window window-two"><span>Window</span><strong>2</strong><small>Lane B</small></div>
      </div>

      <div className={`route-readout ${modifier ? "has-constraint" : ""}`} aria-live="polite">
        <span className="bent-arrow" aria-hidden="true"><UtilityIcon kind="bend" /></span>
        <div>
          <strong>{resolvedAction ? "Recovery committed" : offer?.state === "OFFERED" ? "Exception needs care" : modifier ? "Announced route constraint" : "Ghost pulse preview"}</strong>
          <span>{routeLabel}</span>
        </div>
        <span className="route-cost">{offer ? `${offer.state === "RESOLVED" ? "Applied" : "Choice"} · ${offer.costs.map((cost) => `+${cost.timeCostTicks}t/${cost.freshnessCost} freshness`).join(" or ")}` : modifier ? `Gate A closed ${formatTick(modifier.startsAtTick)}–${formatTick(modifier.endsAtTick)} · Gate B safe` : "No cost until applied"}</span>
      </div>
    </section>
  );
}

function ExceptionRail({
  shift,
  offer,
  onRecover,
}: {
  shift: ShiftState;
  offer: RecoveryOffer | null;
  onRecover: (action: RecoveryAction) => void;
}) {
  const open = offer?.state === "OFFERED";
  const order = offer ? shift.orders.find((candidate) => candidate.id === offer.orderId) : undefined;
  const meal = order ? mealById.get(order.mealId) : undefined;
  const cause = offer ? causeCopy(offer.cause) : null;
  const resolvedAction = offer?.resolvedAction ?? null;
  return (
    <aside className="exception-rail" aria-labelledby="exception-title">
      <div className="panel-title-row">
        <h2 id="exception-title">Exception rail</h2>
        <span className={`status-stamp ${offer?.state === "RESOLVED" ? "resolved" : ""}`}>{offer?.state === "RESOLVED" ? "Resolved" : open ? "Choice open" : "Line clear"}</span>
      </div>
      <article className="exception-card">
        <div
          aria-label="Selected exception order and announced cause"
          className="mobile-wave mobile-exception-context"
        >
          <strong>{order ? `${order.id} · ${meal?.label ?? order.mealId} · ${order.lane}` : "No active exception"}</strong>
          <span>{cause ? `${cause.label} · ${cause.detail}` : "Advance service to reveal the next truthful exception."}</span>
          <span className="mobile-context-help">Keyboard: Tab navigates. Enter or Space applies.</span>
        </div>
        {offer && order && cause ? (
          <>
            <div className="order-identity">
              <span className="ticket-number">{order.id}</span>
              <VehicleIcon type={order.lane === "lane-1" ? "car" : "suv"} />
              <div>
                <strong>{order.lane.replace("lane-", "Lane ")} arrival</strong>
                <span><Shape kind={shapeForMeal(order.mealId)} /> {meal?.label ?? order.mealId}</span>
              </div>
            </div>
            <div className="exception-state">
              <span className="bent-arrow" aria-hidden="true"><UtilityIcon kind="bend" /></span>
              <div>
                <strong>{cause.label}</strong>
                <span>{cause.detail}</span>
              </div>
            </div>

            <div className="meter-block" aria-label="Order status">
              <div><span>Freshness</span><span className="segmented-meter"><i /><i /><i /><i className={order.freshnessPenalty > 0 ? "off" : ""} /></span><strong>−{order.freshnessPenalty}</strong></div>
              <div><span>Time cost</span><span className="segmented-meter accuracy"><i /><i /><i /><i /></span><strong>+{order.recoveryTimeCostTicks}t</strong></div>
            </div>

            <fieldset className="recovery-actions" disabled={!open}>
              <legend>{resolvedAction ? `${actionCopy(resolvedAction).label} applied` : "Choose one offered recovery"}</legend>
              {offer.actions.map((action) => {
                const copy = actionCopy(action);
                const cost = offer.costs.find((candidate) => candidate.action === action);
                return (
                  <button onClick={() => onRecover(action)} className={`action-${action.toLowerCase().replace("_save", "").replace("pull_forward", "rescue")}`} key={action}>
                    <span className="action-icon"><UtilityIcon kind={action === "LOOPBACK_SAVE" ? "loop" : "rescue"} /></span>
                    <span>
                      <strong>{copy.label}</strong>
                      <small>{copy.help}{cost ? ` · +${cost.timeCostTicks} ticks · −${cost.freshnessCost} freshness · ${formatMoney(cost.ledgerCostCents)}` : ""}</small>
                    </span>
                  </button>
                );
              })}
            </fieldset>
          </>
        ) : (
          <div className="exception-empty">
            <span className="bent-arrow" aria-hidden="true"><UtilityIcon kind="bend" /></span>
            <strong>No active exception</strong>
            <span>Advance one deterministic arrival at a time. Ordinary packout and dispatch remain automatic.</span>
          </div>
        )}
        <p className="recovery-truth">Recovery restores lost service credit. It never creates a bonus.</p>
      </article>
      <div className="auto-dispatch">
        <SignalIcon kind="go" />
        <div><strong>Packout is automatic</strong><span>Complete bags clear when the route is sound.</span></div>
      </div>
    </aside>
  );
}

function BatchCommit({
  posture,
  committed,
  onPosture,
  onCommit,
  canCommit,
}: {
  posture: "steady" | "short";
  committed: boolean;
  onPosture: (value: "steady" | "short") => void;
  onCommit: () => void;
  canCommit: boolean;
}) {
  return (
    <section className="commit-drawer" aria-labelledby="commit-title">
      <div className="commit-copy">
        <h2 id="commit-title">Opening batch</h2>
        <p>Choose a visible starting posture. Later shortages become explicit recovery choices.</p>
      </div>
      <div className="posture-picker" role="group" aria-label="Batch posture">
        <button className={posture === "steady" ? "is-selected" : ""} aria-pressed={posture === "steady"} onClick={() => onPosture("steady")}>
          <strong>Steady eight</strong><span>8 of every Phase 1 component</span>
        </button>
        <button className={posture === "short" ? "is-selected" : ""} aria-pressed={posture === "short"} onClick={() => onPosture("short")}>
          <strong>Short five</strong><span>5 of every Phase 1 component</span>
        </button>
      </div>
      <button className={`commit-button ${committed ? "is-committed" : ""}`} onClick={onCommit} disabled={!canCommit || committed}>
        <SignalIcon kind="batch" />
        {committed ? "Batch committed" : "Commit opening batch"}
      </button>
    </section>
  );
}

function serviceConditions(shift: ShiftState) {
  const recovered = shift.recoveries.filter((offer) => offer.state === "RESOLVED").length;
  const dispatched = shift.orders.filter((order) => order.state === "DISPATCHED" || order.state === "RESOLVED_WITH_CARE").length;
  const open = shift.recoveries.filter((offer) => offer.state === "OFFERED").length;
  const result = shift.result;
  return [
    { name: "Warmth", value: result ? `${result.warmth}` : recovered ? "Costed" : "Ready", detail: recovered ? `${recovered} cared-for order${recovered === 1 ? "" : "s"}` : "No recovery cost yet", icon: "steam" },
    { name: "Accuracy", value: result ? `${result.accuracy}` : "Exact", detail: `${dispatched} automatic dispatch${dispatched === 1 ? "" : "es"}`, icon: "target" },
    { name: "Flow", value: result ? `${result.flow}` : open ? "Held" : "Moving", detail: open ? `${open} choice${open === 1 ? "" : "s"} open` : "No choice blocked", icon: "route" },
    { name: "Crew condition", value: result ? `${result.care}` : "Steady", detail: "Protected shift cost fixed", icon: "crew" },
  ];
}

function ServiceStrip({ shift }: { shift: ShiftState }) {
  const services = serviceConditions(shift);
  return (
    <section className="service-strip" aria-label="Service condition">
      <div className="service-rule">
        <strong>Service cares first</strong>
        <span>The house book follows after the shift.</span>
      </div>
      {services.map((service) => (
        <div className="service-item" key={service.name}>
          <span className={`service-symbol ${service.icon}`} aria-hidden="true" />
          <span><strong>{service.name}</strong><small>{service.detail}</small></span>
          <b>{service.value}</b>
        </div>
      ))}
    </section>
  );
}

function MobileServiceSummary({ shift }: { shift: ShiftState }) {
  const services = serviceConditions(shift);
  return (
    <div className="mobile-wave mobile-service-summary" role="group" aria-label="All service conditions">
      {services.map((service) => <span key={service.name}><strong>{service.name}</strong> · {service.value}</span>)}
    </div>
  );
}

function ShiftProgress({
  shift,
  nextArrival,
  openOffer,
  onProgress,
  onReset,
  snapshotReady,
}: {
  shift: ShiftState;
  nextArrival: { id: string; arrivalTick: number } | null;
  openOffer: RecoveryOffer | null;
  onProgress: () => void;
  onReset: () => void;
  snapshotReady: boolean;
}) {
  const isSettled = shift.phase === "SETTLED";
  const actionLabel = nextArrival
    ? `Run next arrival · ${nextArrival.id} at ${formatTick(nextArrival.arrivalTick)}`
    : shift.tick < MIDNIGHT_MERGE.durationTicks
      ? `Close service to ${formatTick(MIDNIGHT_MERGE.durationTicks)}`
      : isSettled
        ? "Shift settled"
        : "Settle shift and open House Book";
  return (
    <section className="shift-progress" aria-label="Local shift progress">
      <div>
        <strong>Local deterministic shift</strong>
        <span>Tick {shift.tick} / {MIDNIGHT_MERGE.durationTicks} · {shift.phase.replaceAll("_", " ").toLowerCase()}</span>
      </div>
      <button type="button" onClick={onProgress} disabled={!snapshotReady || isSettled || openOffer !== null || !shift.forecastRead || shift.batches.length === 0 || shift.paused}>
        {actionLabel}
      </button>
      <button type="button" className="reset-shift" onClick={onReset}>Reset local shift</button>
      <span className="save-state" role="status">{snapshotReady ? `Saved locally · fixture v${shift.fixtureVersion} / rules v${shift.rulesVersion}` : "Restoring local shift…"}</span>
    </section>
  );
}

function HouseBook({ shift, onReplay }: { shift: ShiftState; onReplay: () => void }) {
  if (!shift.result) return null;
  const { ledger, result } = shift;
  const health = result.health.replaceAll("_", " ").toLowerCase();
  return (
    <section className="house-book" aria-labelledby="house-book-title">
      <div className="house-book-heading">
        <span>Shift settled · reducer-derived</span>
        <h2 id="house-book-title">House Book</h2>
        <strong>{health}</strong>
      </div>
      <div className="service-signal">
        <span>Service Signal</span>
        <strong>{result.serviceSignal}</strong>
        <span>{result.dispatchedOrders} / {result.totalOrders} orders dispatched</span>
      </div>
      <dl>
        <div><dt>Ticket sales</dt><dd>{formatMoney(ledger.salesCents)}</dd></div>
        <div><dt>Ingredients</dt><dd>−{formatMoney(ledger.ingredientCostCents)}</dd></div>
        <div><dt>Recovery care</dt><dd>−{formatMoney(ledger.recoveryCostCents)}</dd></div>
        <div><dt>Retired food</dt><dd>−{formatMoney(ledger.retirementCostCents)}</dd></div>
        <div><dt>Protected shift</dt><dd>−{formatMoney(ledger.protectedShiftCostCents)}</dd></div>
        <div className="margin"><dt>Restaurant health margin</dt><dd>{formatMoney(ledger.marginCents)}</dd></div>
      </dl>
      <p>Margin keeps Mile 42 healthy; it is not a transferable reward.</p>
      <div className="shift-postcard" aria-label="Local Shift Postcard">
        <div>
          <span>Local Shift Postcard</span>
          <strong>{shift.faultCount === 0 ? "Rain route read clean" : `${shift.faultCount} wrong turn${shift.faultCount === 1 ? "" : "s"} cared for`}</strong>
          <p>{result.dispatchedOrders} orders reached the window. This local postcard records how the shift ended.</p>
        </div>
        <button type="button" onClick={onReplay}>Run Midnight Merge again</button>
      </div>
    </section>
  );
}

export default function Home() {
  const [viewedWave, setViewedWave] = useState(0);
  const [posture, setPosture] = useState<"steady" | "short">("steady");
  const [shift, setShift] = useState<ShiftState>(() => createInitialShift());
  const [mobileForecastOpen, setMobileForecastOpen] = useState(false);
  const [snapshotReady, setSnapshotReady] = useState(false);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(SNAPSHOT_KEY);
        if (saved) setShift(restoreShift(saved));
      } catch {
        window.localStorage.removeItem(SNAPSHOT_KEY);
        setShift(createInitialShift());
      } finally {
        setSnapshotReady(true);
      }
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!snapshotReady) return;
    window.localStorage.setItem(SNAPSHOT_KEY, serializeShift(shift));
  }, [shift, snapshotReady]);

  const dispatchDomain = (commands: readonly ShiftCommand[]) => {
    setShift((current) => commands.reduce((state, command) => reduceShift(state, command), current));
  };

  const activeGate: GateId = shift.routeBoard.hot === "pack-b" ? "GATE B" : "GATE A";
  const committed = shift.batches.length > 0;
  const openOffer = shift.recoveries.find((offer) => offer.state === "OFFERED") ?? null;
  const latestOffer = openOffer ?? shift.recoveries.at(-1) ?? null;
  const currentWave = useMemo(() => {
    const index = MIDNIGHT_MERGE.waves.findLastIndex((wave) => wave.startsAtTick <= shift.tick);
    return Math.max(0, index);
  }, [shift.tick]);
  const nextArrival = useMemo(() => {
    const planned: Array<{ id: string; arrivalTick: number; waveIndex: number }> = [];
    for (const [waveIndex, wave] of MIDNIGHT_MERGE.waves.entries()) {
      for (const order of wave.orders) planned.push({ id: order.id, arrivalTick: order.arrivalTick, waveIndex });
    }
    return planned.find((order) => order.arrivalTick > shift.tick) ?? null;
  }, [shift.tick]);
  const focusWave = nextArrival?.waveIndex ?? currentWave;

  const activeStage = useMemo(() => shift.result ? 2 : shift.orders.length > 0 ? 2 : committed ? 1 : 0, [committed, shift.orders.length, shift.result]);

  const switchGate = (gate: GateId) => {
    const destination = gate === "GATE B" ? "pack-b" : "pack-a";
    dispatchDomain([{
      type: "SWITCH",
      commandId: `switch:${shift.tick}:${shift.routeBoard.revision + 1}:${gate}`,
      gate: "hot-gate",
      destination,
    }]);
  };

  const readWave = (index: number) => {
    setViewedWave(index);
    setMobileForecastOpen(false);
    if (!shift.forecastRead) {
      dispatchDomain([{ type: "READ", commandId: "read:forecast" }]);
    }
  };

  const commitBatch = () => {
    if (!shift.forecastRead || committed) return;
    const quantity = posture === "steady" ? 8 : 5;
    const components = ["chicken", "waffle-fries", "biscuit", "slaw", "drink"] as const;
    dispatchDomain(components.map((component) => ({
      type: "COMMIT" as const,
      commandId: `commit:${component}:${quantity}`,
      batchId: `opening:${component}`,
      component,
      quantity,
    })));
  };

  const recoverOrder = (action: RecoveryAction) => {
    if (!openOffer) return;
    dispatchDomain([{
      type: "RECOVER",
      commandId: `recover:${openOffer.id}:${action}`,
      recoveryId: openOffer.id,
      action,
    }]);
  };

  const togglePause = () => {
    if (shift.phase === "SETTLED") return;
    dispatchDomain([{
      type: shift.paused ? "RESUME" : "PAUSE",
      commandId: `${shift.paused ? "resume" : "pause"}:${shift.tick}:${shift.processedCommands.length}`,
    }]);
  };

  const progressShift = () => {
    if (openOffer || shift.paused || shift.phase === "SETTLED") return;
    if (nextArrival) {
      dispatchDomain([{
        type: "ADVANCE",
        commandId: `advance:${shift.tick}:${nextArrival.arrivalTick}:${shift.processedCommands.length}`,
        ticks: nextArrival.arrivalTick - shift.tick,
      }]);
      return;
    }
    if (shift.tick < MIDNIGHT_MERGE.durationTicks) {
      dispatchDomain([{
        type: "ADVANCE",
        commandId: `advance:${shift.tick}:${MIDNIGHT_MERGE.durationTicks}:${shift.processedCommands.length}`,
        ticks: MIDNIGHT_MERGE.durationTicks - shift.tick,
      }]);
      return;
    }
    dispatchDomain([{ type: "SETTLE", commandId: `settle:${shift.tick}:${shift.processedCommands.length}` }]);
  };

  const resetShift = () => {
    window.localStorage.removeItem(SNAPSHOT_KEY);
    setShift(createInitialShift());
    setViewedWave(0);
    setPosture("steady");
    setMobileForecastOpen(false);
  };

  return (
    <main className="game-shell">
      <header className="masthead">
        <div className="wordmark" aria-label="Fry Signal, Mile 42">
          <span className="spark" aria-hidden="true"><UtilityIcon kind="spark" /></span>
          <h1>Fry Signal</h1>
          <span className="mile-badge">Mile 42</span>
        </div>
        <SignalMarquee activeStage={activeStage} />
        <div className="shift-controls">
          <div><span>Shift time</span><strong>{shift.paused ? "PAUSED" : "11:42 PM"}</strong></div>
          <button className="pause-button" onClick={togglePause} aria-pressed={shift.paused} disabled={shift.phase === "SETTLED"}>
            <span aria-hidden="true"><UtilityIcon kind={shift.paused ? "play" : "pause"} /></span>{shift.paused ? "Resume" : "Pause"}
          </button>
        </div>
      </header>

      <MobileForecast
        viewedWave={viewedWave}
        currentWave={currentWave}
        expanded={mobileForecastOpen}
        onToggle={() => setMobileForecastOpen((current) => !current)}
        onRead={readWave}
      />

      <div className="playfield">
        <ForecastPanel viewedWave={viewedWave} currentWave={currentWave} onRead={readWave} />
        <RouteBoard activeGate={activeGate} onGate={switchGate} focusWave={focusWave} focusIsUpcoming={focusWave !== currentWave} shift={shift} offer={latestOffer} canSwitch={committed && shift.phase !== "SETTLED"} />
        <ExceptionRail shift={shift} offer={latestOffer} onRecover={recoverOrder} />
      </div>

      <BatchCommit
        posture={posture}
        committed={committed}
        onPosture={setPosture}
        onCommit={commitBatch}
        canCommit={shift.forecastRead}
      />
      <MobileServiceSummary shift={shift} />
      <ShiftProgress
        shift={shift}
        nextArrival={nextArrival}
        openOffer={openOffer}
        onProgress={progressShift}
        onReset={resetShift}
        snapshotReady={snapshotReady}
      />
      <ServiceStrip shift={shift} />
      <HouseBook shift={shift} onReplay={resetShift} />
      <p className="keyboard-help">Keyboard: Tab to read a wave, commit a batch, switch a gate, or choose a recovery. Enter or Space applies the focused control.</p>
    </main>
  );
}
