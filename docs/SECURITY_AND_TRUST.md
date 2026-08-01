# Security and Trust

## Trust model

- **Phase 1 game authority:** versioned content plus a deterministic local reducer.
- **Future shared authority:** a server that issues authority inputs and independently replays ordered commands; it never accepts client-computed totals.
- **Tezos authority:** confirmed canonical ownership only.
- **Client:** input and presentation, never a source of server-verified score, ledger totals, or scarce eligibility.
- **Indexer:** non-authoritative availability projection.

The first screen and complete shift make no wallet, token, RPC, indexer, or network request. A client-only result may remain a local/offchain memory; it can never silently elevate into scarce or transferable eligibility.

## P0 invariants

### Gameplay and labor

- Wallet, token, market, and indexer state cannot affect traffic, timing, freshness, capacity, score, progression, recovery, restaurant health, or crew capability.
- Fair staffing, breaks, wages, and safe heat limits are fixed commitments, not economic levers.
- Every recovery has a bounded visible cost and terminal state. It cannot create food, revenue, score, waste reduction, progression, or eligibility.
- For equal demand and service, intentionally creating a fault can never improve an outcome.
- No mistake, recovery, spoilage, refund, abandonment, or failed shift destroys or mutates an owned asset.

### Deterministic play

- A replay binds reducer/content versions, content hash, seed, ordered input sequence, revision, and deterministic ticks.
- Commands are schema-bounded and state-valid; duplicates, missing/reordered entries, stale revisions, unknown versions, and cross-shift replay fail visibly.
- Pause, background/resume, reload, clock change, and multiple tabs have explicit semantics; client wall time is not authority.
- Scarce eligibility, if ever approved, binds a server-verified shift and documented uniqueness rule; no client-supplied score, margin, freshness, waste, or eligibility total is trusted.

### Final wallet dispatch

Every future onchain intent binds wallet-runtime generation, session revision, source account, permission scope, chain ID, destination, entrypoint, attached mutez, canonical payload/hash, manifest hash, opaque intent ID, nonce, and expiry.

Revalidate after the wallet SDK's final active-account read and synchronously before dispatch, with no intervening await. Account, network, scope, session, reconnect, manifest, expiry, or payload drift yields zero send.

### Network and asset identity

- Ordinary chain work uses loopback Localnet; Shadownet is explicit exact-candidate rehearsal; Mainnet has no development command.
- Missing, unknown, conflicting, or browser/server-mismatched network authority stops startup.
- Localnet has no assumed public indexer. A shared reset makes old local manifests and evidence stale.
- The sole asset identity is manifest-verified `chain_id + contract_address + token_id` with pinned standard, entrypoints, code/policy hash, metadata digest, supply/caps, transfer policy, and authorities.
- Name, ticker, image, culinary meaning, arbitrary wallet contents, and indexer search never authorize.

### Exactly-once effects and chain truth

- Actor-scoped opaque intent IDs, expiring domain-separated permits, database uniqueness, transactional outbox processing, idempotent workers, and contract-consumed uniqueness keys must converge.
- Identical retries return original status; reuse with changed payload/account/network/version rejects.
- Track awaiting signature, submitted, included, confirmed/finalized, failed, dropped, replaced, and reorged separately.
- Only confirmed canonical events change ownership. Reorg rolls projections back and triggers reconciliation.
- Receipts bind account, chain, contract/token, operation/block, payload, manifest/policy, intent, nonce, and confirmation evidence.

### Authority and content safety

- Separate deployer, bounded issuer, pause guardian, and metadata curator; prefer immutable code, content-addressed metadata, hardware multisig, and timelocked public policy diffs.
- No arbitrary mint, seizure, confiscating pause, silent metadata rewrite, hidden upgrade, or production faucet/debug entrypoint.
- Arbitrary remote contracts or URLs are never trusted. Text is normalized, bounded, and escaped.
- Remote media, if ever needed, uses an SSRF-resistant broker with redirect/DNS rechecks, private/link-local/metadata-service denial, byte/time/decompression/dimension/frame bounds, magic-byte validation, quarantine, metadata stripping, and safe raster transcoding.
- Active HTML/SVG/PDF never renders on the app origin. IPFS gives identity, not safety.

### Privacy and market pressure

- Never put score, shift ledger, orders, customers, dialogue, location, accessibility, analytics/device IDs, or restaurant health onchain.
- Pre-sign review explains public permanence. Any proof uses a high-entropy salted opaque commitment, never a guessable shift/database ID.
- No floor price, portfolio value, ROI, yield, scarcity countdown, wallet-value ranking, market-volume reward, or default marketplace link in play.
- Rate and anomaly controls target floods, impossible timing, duplicates, probing, farms, and automation without penalizing accessibility inputs or ordinary fast play.

## Release gates

### A — walletless vertical

- Complete accessible shift with networking disabled.
- Deterministic example/property/replay coverage includes every transition and recovery.
- Hostile input, corruption, duplicate, clock, background/resume, and multi-tab tests pass.
- Telemetry, retention, export, deletion, and recovery boundaries are reviewed before collection.

### B — optional Localnet Signal Fixture proof

- The walletless game has already passed and the exact fixture action is approved.
- Shared consumer conformance and project/environment-scoped typed manifest pass.
- Stale/foreign manifest rejection, exact identity, authority, caps, uniqueness, replay, atomic failure, pause, and forbidden-entrypoint tests pass.
- Real wallet-SDK race tests prove drift yields zero stale dispatch.
- No-indexer behavior remains truthful and usable.

### C — exact-candidate Shadownet

- Record exact source commit, build artifacts, chain, addresses, originations, manifest, policy/content versions, and local gate results.
- Reconstruct code, state, authorities, metadata, supply, and identity from chain evidence.
- Rehearse reject/submit/confirm/receipt/duplicate/drift/lag/RPC failure/reorg on real wallet and mobile surfaces.
- Independent security review has no unresolved critical/high findings.

### D — transfer, payment, marketplace, or Mainnet

Separate go/no-go with contract audit, legal/consumer review, admin and incident design, anti-scam UX, abuse monitoring, and explicit authorization. Earlier green tests do not imply this gate.

## Evidence discipline

Report source/tests/build, running deployment and manifest, authenticated wallet journey, Shadownet rehearsal, Mainnet readiness, and physical-device/accessibility proof separately. None substitutes for another.

## Evidence

- Full threat foundation: `../../../RESEARCH/FRY_SIGNAL_SECURITY_AND_ABUSE_FOUNDATION_2026_07_31.md`.
- Localnet boundary: `../../../RESEARCH/TEZOS_LOCALNET_SETUP_REVIEW_2026_07_31.md` and [TEZOS_LOCALNET_LIFECYCLE.md](./TEZOS_LOCALNET_LIFECYCLE.md).
- Security lane and reconciliation: Buzz events `5ca0863aab7b0f4178dea1b10cb55777545e6c76fb3375cf8eabd038561491c8` and `92631d2a828ffa22b21f921dd24f0b6e3e05cf55d7c4a88e4cf4c3235066fcc8`.
