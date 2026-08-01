# Technical Specification

## Evidence boundary

This document defines an intended architecture. It is not evidence of an application, API, database, contract, deployment, Localnet integration, Shadownet rehearsal, or authenticated wallet journey.

Phase 1 is a local, network-free vertical. The authoritative state is a versioned deterministic reducer plus fixture content and local save/resume. Postgres, server authority, account merging, and chain workers are deferred until shared or multi-device persistence is explicitly in scope.

## Smallest Phase 1 workspace

```text
apps/
  web/          Next.js player shell and local persistence adapter
packages/
  domain/       pure reducer, commands, events, invariants, replay digest
  content/      immutable versioned menu, waves, events, recoveries
  ui/           Fry Signal-specific accessible primitives
```

Use pinned Node, pnpm, Next.js, React, and TypeScript versions. Do not add Postgres, a separate API, queue product, Redis, GraphQL, realtime sockets, wallet SDK, RPC client, or indexer in Phase 1.

## Domain model

Suggested types:

```text
ContentBundle { id, version, contentHash, menuRefs, waveRefs, recoveryRefs }
ShiftSession { id, reducerVersion, contentVersion, seed, revision, tick, state }
TrafficWave { index, forecast, revealedDemand, topologyModifier, state }
TopologyModifier { id, source, blockedDestination, safeDestination, startsAtTick, endsAtTick }
OrderTicket { id, wave, lane, items, state }
CookBatch { id, itemRef, committedQty, availableQty, readyTick, retireTick, state }
RouteBoard { topologyVersion, gateStates, nodeQueues }
PackTicket { id, orderId, allocations, state }
RecoveryOffer { id, cause, actions, expiresTick }
ShiftLedger { entries, sales, ingredientCost, wasteCost, recoveryCost, fairStaffingCost }
RestaurantHealth { accuracy, warmth, flow, guestCare, crewAndEquipmentCare }
PlayerProgress { revision, unlockedTopologies, storyDecks, expression }
```

Commands are limited to the canonical verbs: `StartShift`, `CommitPlan`, `CommitBatch`, `FlipGate`, `SelectRecovery`, `ReleaseNextWave`, `CloseShift`, and `AbandonShift`. Ordinary packout and dispatch are reducer consequences; manual correction is an explicit recovery command.

The reducer uses integer ticks, quantities, and cents. Frame time, `Date.now()`, floating-point money, wallet state, RPC, indexer data, token prices, and remote content never influence outcomes.

Announced route constraints are structured content, never parsed from display copy. A topology modifier names the affected source, blocked destination, safe destination, and inclusive tick window. Each arriving order captures the route board at that moment, so a switch affects only newly arriving trays. A blocked snapshot creates one bounded recovery offer; choosing the disclosed safe route avoids that recovery without changing demand.

## Determinism and persistence

Given the same reducer version, content hash, seed, and ordered commands, the reducer must produce byte-identical terminal state and replay digest across supported browser builds.

Phase 1 rules:

- local save data stores the full authority tuple: reducer/content versions, content hash, seed, revision, ordered commands or snapshot plus subsequent commands, and integrity digest;
- reload and background/resume never reroll traffic or erase decisions;
- pause freezes ticks, arrivals, cooking, freshness, and scoring;
- migration is explicit; an unknown reducer/content version fails visibly instead of guessing;
- local storage contains no secret ownership entitlement and cannot create scarce or transferable eligibility;
- export, delete, corruption recovery, and storage-quota behavior require tests and plain UI.

## Core invariants

1. One order occupies exactly one valid route/pack/terminal state.
2. Batch quantity is conserved: committed equals allocated plus available plus retired/discarded.
3. One completed pack dispatches at most once to its matching order.
4. Every sale, ingredient use, waste, recovery, and fixed staffing cost posts once; settlement recomputes totals from events.
5. Recovery cannot create food, revenue, score, health, progression, postcard status, or future eligibility.
6. A profitable shift can fail service and crew/equipment gates.
7. Owned assets are absent from the reducer; mistakes and failed shifts cannot mutate ownership.
8. Network availability cannot change Phase 1 play, save, progression, or debrief.
9. Route-blocked recovery exists if and only if an order snapshot uses a physically blocked path or violates its wave's structured topology modifier.

## UI architecture

The route board is the continuous center of state on desktop and mobile. UI animation subscribes to committed domain events and may predict previews, but presentation never invents a settled result.

Every action uses select → preview → apply. Preview is undoable; a committed command creates history and must be handled by recovery, not silent rewind. Automatic pack/send events still expose order identity and accessible state text immediately; animation can be skipped without delaying domain resolution.

## Deferred server authority

Add a server only when shared accounts, multi-device continuity, moderated shared events, or scarce/transferable eligibility are approved. At that point, decide account/privacy/offline/merge semantics in an ADR before implementation.

A production-shaped server may use a Next.js BFF and Postgres with:

- hashed guest resume secrets in Secure, HttpOnly, SameSite cookies;
- revisioned commands carrying command ID, idempotency key, expected revision, and bounded payload;
- one transaction that locks the shift, rejects stale or mismatched replay, runs the same pure reducer, appends events, and updates the snapshot;
- uniqueness on shift/command, shift/sequence, and player/progression event;
- deterministic replay that derives all results and rejects client-computed totals.

A client-only shift never silently becomes server-trusted. Scarce or transferable eligibility requires a separately disclosed server-verified mode with server-issued authority inputs and replayed ordered commands.

## Deferred ownership architecture

Only after the walletless game passes and one Signal Fixture action is approved may the workspace add:

```text
apps/chain-worker/
packages/tezos/
contracts/ownership/
```

The worker owns submitted/included/confirmed/finalized/dropped/replaced/reorged status and canonical reconciliation. One intent can have multiple immutable attempts. Indexers are projections only. The game reducer remains independent of wallet, chain, and ownership.

See [ECONOMY_AND_OWNERSHIP.md](./ECONOMY_AND_OWNERSHIP.md), [SECURITY_AND_TRUST.md](./SECURITY_AND_TRUST.md), and [TEZOS_LOCALNET_LIFECYCLE.md](./TEZOS_LOCALNET_LIFECYCLE.md).

## Architecture gates

- Phase 1 runs with all network access disabled.
- Golden replay parity holds after reload, pause, background/resume, and supported browser builds.
- UI and reducer disagreeing causes a visible safe failure, never silent settlement.
- No Phase 1 package imports wallet, RPC, indexer, or server-persistence code.
- Server persistence and ownership are separate approved changes with migration, privacy, replay, and failure contracts.

## Evidence

- Local-first security contract: `../../../RESEARCH/FRY_SIGNAL_SECURITY_AND_ABUSE_FOUNDATION_2026_07_31.md`.
- Shared lifecycle review: `../../../RESEARCH/TEZOS_LOCALNET_SETUP_REVIEW_2026_07_31.md`.
- Architecture proposal and final correction: Buzz events `305af1f165c935f0162da8552d5413bb04c7a7b3aa4ef526e25ac79abbbb9985`, `92631d2a828ffa22b21f921dd24f0b6e3e05cf55d7c4a88e4cf4c3235066fcc8`, and `27ca0bd235c7e5af1856e3f57c0dce739d50c482e426ac7546aeeede232da3fb`.
