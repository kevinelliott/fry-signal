# Testing Strategy

## Evidence boundary

This is the required verification contract. No test results, playable build, deployment, chain integration, authenticated wallet journey, or device proof exist merely because these gates are documented.

## Phase 1 domain matrix

### Examples, properties, fuzz, and mutation tests

- legal/illegal shift, wave, order, batch, route, pack, dispatch, and recovery transitions;
- same reducer/content versions, content hash, seed, and ordered commands produce byte-identical state and digest;
- order identity and route occupancy are unique; nothing duplicates or disappears;
- batch conservation across cooking, allocation, holding, retirement, and waste;
- automatic packout requires exact matching components and dispatch consumes one pack once;
- integer-cent ledger reconciliation and fixed fair staffing cost;
- pause, Slow Shift, reload, background/resume, clock change, and abandonment;
- unknown content/reducer version, corrupted save, incomplete write, and quota failure;
- every recovery is bounded and terminates;
- fault injection cannot create food, revenue, score, health, progress, postcard, or future eligibility;
- for equal demand and service, deliberate fault + recovery never beats clean routing;
- a single route, batch, mismatch, or station mistake cannot make the shift unwinnable.

### Golden replays

Maintain authored fixtures for:

- clean three-wave run;
- announced route constraint plus each valid recovery;
- announced route constraint avoided by the disclosed safe route, including switch timing boundaries;
- intentionally induced recovery-farming attempt;
- pause/background/reload at every state boundary;
- mobile and desktop command streams producing the same result;
- corrupted/stale version failure without reroll.

Run replay fixtures in the pure domain package and supported browser build. Frame rate and animation preference must not affect the digest.

## Content and schema gates

- immutable unique IDs and hashes for menu, wave, event, topology, recovery, and copy versions;
- forecast ranges contain every possible arrival and order family;
- tutorial recovery is announced or unscored; no surprise sabotage fixture;
- route topology is reachable and every bottleneck has at least one bounded recovery;
- topology modifiers use structured source, blocked/safe destination, and tick-window fields; display prose cannot change authority;
- event pairs are reviewed and cannot form hidden chaos or an impossible load;
- every critical signal includes stable position, text label, shape/pattern, and accessible name;
- menu entries include component, allergen/dietary, holding, cost, and failure-conversion data;
- no power/currency/market asset reference enters gameplay content;
- only one focal regular, one teaching voice, three meal families, and one event ship in the first vertical unless the scope decision changes.

## Local persistence and trust tests

- save/resume at every revision and deterministic reconstruction from snapshot/commands;
- duplicate tab, stale tab, partial write, storage clearing, export, delete, and recovery;
- unknown version and digest mismatch fail visibly;
- all Phase 1 journeys pass with network interception configured to reject every request;
- local results contain no fixture/transfer entitlement and cannot be imported as server-verified evidence.
- saving and restoring during an active topology modifier preserves the selected route, modifier window, recovery truth, and replay digest.

When shared persistence is later approved, add transaction rollback, stale revision, duplicate/changed-payload idempotency keys, concurrent commands, snapshot rebuild, session expiry, guest/account merge, deletion/export, and server replay rejection of forged totals or reordered inputs.

## UI, responsive, and accessibility gates

Manual and automated journeys at 320, 390, 768, 1024, and 1440px cover:

- continuous route topology and active bottleneck without horizontal overflow;
- keyboard, touch, pointer, and switch/select → preview → apply parity;
- 44px targets, clear 3px focus, logical focus order, focus trap/restore, safe areas;
- 200% zoom, user text scaling, forced colors, grayscale, muted audio, captions;
- reduced motion preserving route cause, destination, timing, and result;
- screen-reader announcements only for meaningful thresholds;
- one-handed mobile play without hiding the board behind task pages;
- no animation or skip state delaying domain truth.

Usability gates:

- ≥80% of moderated first-run players say their core job is shaping flow;
- ≥60% choose another shift to try a different route;
- no mandatory idle interval exceeds five seconds;
- every material hazard is understood from announced word and non-color cues;
- players cannot improve results by manufacturing recovery.

Collect and calculate this evidence with [GATE_1_PLAYTEST_PROTOCOL.md](./GATE_1_PLAYTEST_PROTOCOL.md). Keep usability observations separate from automated test counts, and bind every cohort to one exact clean candidate.

## Performance and reliability

- deterministic reducer command latency remains below one animation frame on target devices under the first-vertical load;
- input remains responsive during wave animation and contextual sheets;
- no layout shift hides a gate or active order;
- offline cold start, save, reload, and debrief work without service worker/network ambiguity;
- memory and timer cleanup passes repeated-shift and background/resume soak tests.

## Deferred ownership matrix

Run only after the Signal Fixture gate is approved:

- wallet drift at every await and the final synchronous dispatch boundary;
- reject, disconnect, reconnect overlap, account/network/scope change, duplicate click, multi-tab, timeout, stale resume;
- manifest chain/address/code/policy/authority/metadata drift and stale post-reset evidence;
- contract authorization, caps, single-use nonce, atomic failure, pause, forbidden entrypoints, and canonical payload fixtures;
- requested/submitted/included/confirmed/finalized/failed/dropped/replaced/reorged lifecycle;
- RPC outage, no-indexer Localnet, malformed/lagging indexer, partial pages, replacement, duplicate event, and reorg reconciliation;
- ownership grants expression only and cannot change reducer output;
- hostile text/media, CSP, external link, privacy, retention, and public-chain disclosure tests.

Run shared Localnet policy and consumer-conformance gates as well as Fry Signal's own suite. Shadownet repeats the exact clean candidate; it is not a substitute for Localnet or device evidence.

## CI and reporting

Minimum Phase 1 CI categories:

1. formatting, lint, typecheck, and build;
2. domain unit/property/fuzz/mutation and golden replay parity;
3. content/schema validation;
4. local persistence/corruption/offline tests;
5. browser responsive/accessibility journeys;
6. dependency, secret, and prohibited-import scans.

Report exact HEAD and dirty state with results. Keep source/test/build evidence separate from usability, deployment, wallet, chain, Mainnet, and physical-device proof.

## Evidence

- Domain and delivery proposal: Buzz event `305af1f165c935f0162da8552d5413bb04c7a7b3aa4ef526e25ac79abbbb9985`.
- Playable shift contract: Buzz event `82a2294fc3b4aca40515af3f0fa20331ac384e1a0483a324d91fdb2cff606b5b`.
- Interface acceptance contract: Buzz event `990b0f4e6680e670fc496b5a7de5b7e8d02f56cd563cb569619c6dc3637067c1`.
- Security foundation: `../../../RESEARCH/FRY_SIGNAL_SECURITY_AND_ABUSE_FOUNDATION_2026_07_31.md`.
