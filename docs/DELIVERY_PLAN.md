# Delivery Plan

## Gate 0 — foundation only

Deliver the product, game, design, economy, security, technical, testing, decision, and Localnet lifecycle contracts; workspace/version pins; schemas for versioned content; deterministic clock/seed testkit; CI; and explicit open ADRs.

Exit:

- clean-checkout documentation and package gates pass;
- all foundation conflicts are resolved in favor of `read → commit → switch → recover`;
- no app, database, contract, Localnet integration, deployment, or playable claim is implied.

## Gate 1 — gray-box route board

Build the pure reducer and golden three-wave fixture before art breadth, server persistence, or a contract.

Scope:

- one local/network-free five-to-seven-minute shift;
- continuous board with two lanes, two fryers, hot/cold/drink paths, automatic ordinary packout/dispatch, one pull-ahead or loopback path, and three meal silhouettes;
- one focal regular, one teaching crew voice, and one announced topology event;
- ghost-pulse preview, Light Run feedback, Loopback Save, and one other bounded recovery;
- local save/resume, pause, Slow Shift, reduced motion, sound captions, keyboard/touch parity, debrief, and local Shift Postcard;
- mobile vertical board with contextual action sheets, never five disconnected task pages.

Exit:

- the board proves the core sentence without art, story, or crypto;
- no mandatory idle interval exceeds five seconds;
- every bottleneck has a one-move recovery;
- recovery is non-farmable and tutorial recovery comes from an announced constraint or unscored beat;
- deterministic, responsive, accessibility, local persistence, and abuse gates pass with networking disabled;
- moderated targets in [GAME_DESIGN_SPEC.md](./GAME_DESIGN_SPEC.md) are met.

## Gate 2 — playable breadth

Only after Gate 1 proves replayability, add authored road-event decks, topology side-grades, additional menu programs, crew/customer stories, walk-up access, roadside restoration, expression, audio layers, and larger content validation.

Do not add raw speed upgrades, daily chores, broad procedural systems, a chain, or server persistence merely to create breadth.

Exit: expanded content preserves route readability, replay motivation, humane labor framing, deterministic conservation, accessibility, and performance.

## Gate 3 — shared persistence, if earned

Start only when multi-device continuity, shared accounts, moderated shared events, or another concrete need exists.

Before implementation, approve ADRs for account identity, guest migration, offline behavior, privacy/retention, deletion/export/recovery, conflict resolution, and local-to-server trust. Add a replay-validating service and Postgres only after those choices.

Exit: server authority independently derives outcomes, local results never silently become server-trusted, concurrent/idempotent commands pass, and shared persistence failure cannot erase valid local play.

## Gate 4 — one Localnet Signal Fixture proof, if justified

Choose one exact cosmetic fixture action after the walletless game passes. Do not add a second asset class.

Then add a narrowly scoped contract, typed project manifest/readiness checks, wallet preview, final-dispatch guard, durable intent/attempt lineage, chain worker, receipt, confirmation/reorg reconciliation, and safe metadata path.

Exit:

- the shared Localnet lifecycle passes claim/receive or verify, confirmation, inspect, install, unlink/relink, duplicate, drift, reset/stale manifest, indexer absence, RPC failure, and reorg cases;
- owning the fixture changes no gameplay or economic opportunity;
- exact evidence is reported separately from build/test results.

## Gate 5 — exact-candidate Shadownet

Promote one clean, exact candidate. Record commit, build artifacts, chain, originations, addresses, manifest, policies, and tests. Rehearse real wallet reject/submit/confirm, account/network/scope drift, reload, duplicate, replacement, lag, outage, and reorg behavior on physical/mobile surfaces.

Exit: independent review has no unresolved critical/high findings. Shadownet success is not Mainnet readiness.

## Gate 6 — separate production decisions

Mainnet, paid issuance, transferability, marketplaces, foreign-asset recognition, cross-title interoperability, multiplayer, public leaderboards, user-generated signage, and multiple locations are independent go/no-go decisions. Each requires relevant product, security, privacy, legal, consumer-truth, operational, and abuse evidence.

## Workstreams

- Domain/gameplay: reducer, fixtures, replay, recovery, results.
- Product/content: Mile 42 world, authored waves, cast/menu restraint, research.
- Interface: continuous board, signal grammar, responsive/accessibility, feedback.
- Platform: local persistence first; shared authority only after Gate 3.
- Ownership: absent until Gate 4; then exact identity, wallet, worker, contract, manifest.
- Trust/release: threats, privacy, abuse, evidence, independent review.

## Evidence discipline

Track separately:

1. source, tests, and builds;
2. gray-box usability and replay evidence;
3. deployed runtime and exact manifest;
4. authenticated wallet journey;
5. Localnet and Shadownet evidence;
6. Mainnet readiness;
7. physical-device and accessibility proof.

## Publication and snapshot authority

The original GitHub repository, <https://github.com/kevinelliott/fry-signal>, is the publication authority. A feature branch, pull request, local commit, CI result, Buzz repository announcement, or deployed preview is not a project snapshot.

Only a state merged to remote `main` can become a snapshot. After merge:

1. verify the remote `main` SHA from the GitHub authority;
2. sync the canonical local checkout to that exact SHA without discarding unrelated work;
3. rerun the gates whose evidence will be attached to the snapshot;
4. publish any snapshot tag or release record to the original GitHub repository and bind it to the verified `main` SHA.

The current foundation branch/PR work must not be described as a snapshot, release, or merged foundation until those checks are complete.

## Evidence

- Final architecture/delivery proposal: Buzz event `305af1f165c935f0162da8552d5413bb04c7a7b3aa4ef526e25ac79abbbb9985`.
- Product reconciliation and scope corrections: Buzz event `27ca0bd235c7e5af1856e3f57c0dce739d50c482e426ac7546aeeede232da3fb`.
- Shared lifecycle boundary: [TEZOS_LOCALNET_LIFECYCLE.md](./TEZOS_LOCALNET_LIFECYCLE.md).
