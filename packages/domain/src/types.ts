export type Tick = number;
export type Cents = number;

export type ComponentId =
  | "chicken"
  | "waffle-fries"
  | "biscuit"
  | "slaw"
  | "drink";

export type LaneId = "lane-1" | "lane-2";
export type SourceId = "hot" | "cold" | "drink";
export type DestinationId = "pack-a" | "pack-b" | "loopback";
export type GateId = "hot-gate" | "cold-gate" | "drink-gate";

export interface ComponentQuantity {
  readonly component: ComponentId;
  readonly quantity: number;
}

export interface MealDefinition {
  readonly id: "tender-box" | "biscuit-basket" | "night-bucket";
  readonly label: string;
  readonly priceCents: Cents;
  readonly requirements: readonly ComponentQuantity[];
}

export interface ForecastRange {
  readonly minimumOrders: number;
  readonly maximumOrders: number;
  readonly dominantMeals: readonly MealDefinition["id"][];
  readonly signalLeadTicks: Tick;
}

export interface OrderPlan {
  readonly id: string;
  readonly arrivalTick: Tick;
  readonly lane: LaneId;
  readonly mealId: MealDefinition["id"];
}

export interface TopologyModifier {
  readonly id: "rain-hot-crossover";
  readonly source: SourceId;
  readonly blockedDestination: DestinationId;
  readonly safeDestination: DestinationId;
  readonly startsAtTick: Tick;
  readonly endsAtTick: Tick;
}

export interface WaveDefinition {
  readonly id: "commuter-drift" | "rain-detour" | "arena-let-out";
  readonly label: string;
  readonly startsAtTick: Tick;
  readonly endsAtTick: Tick;
  readonly forecast: ForecastRange;
  readonly announcedConstraint: string | null;
  readonly topologyModifier: TopologyModifier | null;
  readonly orders: readonly OrderPlan[];
}

export interface ShiftFixture {
  readonly id: "midnight-merge";
  readonly version: 2;
  readonly rulesVersion: 2;
  readonly label: string;
  readonly durationTicks: Tick;
  readonly meals: readonly MealDefinition[];
  readonly waves: readonly [WaveDefinition, WaveDefinition, WaveDefinition];
}

export interface RouteSnapshot {
  readonly hot: DestinationId;
  readonly cold: DestinationId;
  readonly drink: DestinationId;
}

export interface RouteBoard extends RouteSnapshot {
  readonly revision: number;
}

export type BatchState = "COOKING" | "AVAILABLE" | "DEPLETED" | "RETIRED";

export interface CookBatch {
  readonly id: string;
  readonly component: ComponentId;
  readonly committedQuantity: number;
  readonly availableQuantity: number;
  readonly allocatedQuantity: number;
  readonly retiredQuantity: number;
  readonly committedAtTick: Tick;
  readonly readyAtTick: Tick;
  readonly state: BatchState;
}

export type OrderState =
  | "ARRIVED"
  | "WAITING_COMPONENT"
  | "ROUTE_BLOCKED"
  | "RECOVERING"
  | "DISPATCHED"
  | "RESOLVED_WITH_CARE";

export interface OrderTicket {
  readonly id: string;
  readonly waveId: WaveDefinition["id"];
  readonly lane: LaneId;
  readonly mealId: MealDefinition["id"];
  readonly arrivedAtTick: Tick;
  readonly routeSnapshot: RouteSnapshot;
  readonly state: OrderState;
  readonly dispatchedAtTick: Tick | null;
  readonly recovered: boolean;
  readonly recoveryTimeCostTicks: Tick;
  readonly freshnessPenalty: number;
}

export type RecoveryCause = "ROUTE_BLOCKED" | "WAITING_COMPONENT";
export type RecoveryAction = "LOOPBACK_SAVE" | "PULL_FORWARD" | "SHORT_BATCH";

export interface RecoveryActionCost {
  readonly action: RecoveryAction;
  readonly timeCostTicks: Tick;
  readonly freshnessCost: number;
  readonly ledgerCostCents: Cents;
}

export interface RecoveryOffer {
  readonly id: string;
  readonly orderId: string;
  readonly cause: RecoveryCause;
  readonly actions: readonly RecoveryAction[];
  readonly costs: readonly RecoveryActionCost[];
  readonly state: "OFFERED" | "RESOLVED";
  readonly resolvedAction: RecoveryAction | null;
}

export type LedgerEntryKind =
  | "INGREDIENT_COST"
  | "SALE"
  | "RECOVERY_COST"
  | "RETIREMENT_COST";

export interface LedgerEntry {
  readonly id: string;
  readonly kind: LedgerEntryKind;
  readonly amountCents: Cents;
  readonly tick: Tick;
  readonly referenceId: string;
}

export interface ShiftLedger {
  readonly entries: readonly LedgerEntry[];
  readonly salesCents: Cents;
  readonly ingredientCostCents: Cents;
  readonly recoveryCostCents: Cents;
  readonly retirementCostCents: Cents;
  readonly protectedShiftCostCents: Cents;
  readonly marginCents: Cents;
}

export interface ShiftResult {
  readonly serviceSignal: number;
  readonly accuracy: number;
  readonly warmth: number;
  readonly flow: number;
  readonly care: number;
  readonly health: "HEALTHY_SHIFT" | "LOVED_BUT_STRETCHED" | "NEEDS_A_RESET";
  readonly progressionPoints: number;
  readonly dispatchedOrders: number;
  readonly totalOrders: number;
}

export type ShiftPhase =
  | "BRIEFING"
  | "PLANNING"
  | "WAVE_ACTIVE"
  | "INTERWAVE"
  | "FINAL_RECOVERY"
  | "SETTLED";

export interface ProcessedCommand {
  readonly id: string;
  readonly fingerprint: string;
  readonly type: ShiftCommand["type"];
}

export interface ShiftState {
  readonly schemaVersion: 1;
  readonly fixtureId: ShiftFixture["id"];
  readonly fixtureVersion: ShiftFixture["version"];
  readonly rulesVersion: ShiftFixture["rulesVersion"];
  readonly tick: Tick;
  readonly phase: ShiftPhase;
  readonly paused: boolean;
  readonly forecastRead: boolean;
  readonly routeBoard: RouteBoard;
  readonly batches: readonly CookBatch[];
  readonly orders: readonly OrderTicket[];
  readonly recoveries: readonly RecoveryOffer[];
  readonly ledger: ShiftLedger;
  readonly faultCount: number;
  readonly processedCommands: readonly ProcessedCommand[];
  readonly result: ShiftResult | null;
}

interface CommandBase {
  readonly commandId: string;
}

export interface ReadCommand extends CommandBase {
  readonly type: "READ";
}

export interface CommitCommand extends CommandBase {
  readonly type: "COMMIT";
  readonly batchId: string;
  readonly component: ComponentId;
  readonly quantity: number;
}

export interface SwitchCommand extends CommandBase {
  readonly type: "SWITCH";
  readonly gate: GateId;
  readonly destination: DestinationId;
}

export interface RecoverCommand extends CommandBase {
  readonly type: "RECOVER";
  readonly recoveryId: string;
  readonly action: RecoveryAction;
}

export interface AdvanceCommand extends CommandBase {
  readonly type: "ADVANCE";
  readonly ticks: Tick;
}

export interface PauseCommand extends CommandBase {
  readonly type: "PAUSE";
}

export interface ResumeCommand extends CommandBase {
  readonly type: "RESUME";
}

export interface SettleCommand extends CommandBase {
  readonly type: "SETTLE";
}

export type ShiftCommand =
  | ReadCommand
  | CommitCommand
  | SwitchCommand
  | RecoverCommand
  | AdvanceCommand
  | PauseCommand
  | ResumeCommand
  | SettleCommand;

export interface ReplayResult {
  readonly state: ShiftState;
  readonly commands: readonly ShiftCommand[];
  readonly digest: string;
}
