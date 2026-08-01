# Decision Register

| ID | Decision | Status | Rationale / exit condition |
| --- | --- | --- | --- |
| FS-D-001 | Fry Signal is a traffic-routing game with restaurant consequences. | Adopted foundation | Distinct from sibling games; reverse only by explicit product decision. |
| FS-D-002 | Canonical verbs are `read → commit → switch → recover`; ordinary packout and dispatch are automatic consequences. | Adopted foundation | Prevents six shallow minigames. Manual pack/send is only for exceptions and recovery. |
| FS-D-003 | Build a pure three-wave reducer and gray-box route board before art breadth, persistence, or contracts. | Adopted foundation | Fun must survive without story, art, or tokens. |
| FS-D-004 | Phase 1 is fully local, network-free, walletless, and locally authoritative. | Adopted foundation | Complete play, debrief, progression, and replay require no service. |
| FS-D-005 | Postgres/server persistence is deferred until shared or multi-device play earns it. | Adopted foundation | Account, privacy, offline, merge, deletion, and recovery semantics require an ADR first. |
| FS-D-006 | Client-only results never silently create scarce or transferable eligibility. | Adopted foundation | Future eligibility requires a separately disclosed server-verified replay mode. |
| FS-D-007 | The route board and active bottleneck remain continuously visible on mobile. | Adopted foundation | Contextual sheets may assist; five task-page hops are rejected. |
| FS-D-008 | Recovery has a bounded visible cost and only restores otherwise-lost service credit. | Adopted foundation | Intentionally creating a fault cannot improve any result, progression, postcard, or eligibility. |
| FS-D-009 | Tutorial recovery comes from an announced constraint or unscored beat, never surprise sabotage in a scored wave. | Adopted foundation | Forecasts remain honest and learnable. |
| FS-D-010 | Mile 42 is a dependable one-stop roadside landmark; crew safety, breaks, wages, and fair staffing are fixed commitments. | Adopted foundation | The player improves the system rather than extracting labor. |
| FS-D-011 | Phase 1 content is one night, three meal families, one focal regular, one teaching crew voice, and one announced event. | Adopted foundation | Broader cast/menu follows route replayability. |
| FS-D-012 | Restaurant margin is a private, non-transferable health constraint; Operating Reserve funds in-fiction reinvestment. | Adopted foundation | Profit supports the restaurant concept without becoming the player promise. |
| FS-D-013 | No umbrella currency, DER role, tokenized routine food, wallet gate, power asset, or market signal in gameplay. | Adopted foundation | Throughput is gameplay; ownership is memory. |
| FS-D-014 | The first possible crypto proof is one Signal Fixture flow after the walletless game passes. | Adopted foundation | Defer Night Dispatch Card and every second asset class; no paid first proof. |
| FS-D-015 | Ordinary chain work is loopback Localnet; Shadownet is explicit exact-candidate rehearsal; Mainnet is absent from development. | Adopted foundation | Missing/mismatched authority fails closed. |
| FS-D-016 | Exact token identity is `chain_id + contract + token_id` in a typed, reconstructed manifest. | Adopted foundation | Names, tickers, images, and indexers cannot authorize. |
| FS-D-017 | Working title is Fry Signal under Open Sign Games, pending formal clearance. | Open gate | Complete exact/phonetic trademark, storefront, company, domain, social, and counsel review. |
| FS-D-018 | Final menu/cast breadth and authored world details require content, accessibility, and inclusion review. | Open gate | Review before public asset lock, not after production. |
| FS-D-019 | Mainnet, payment, transferability, marketplace, foreign assets, multiplayer, and public leaderboards are separate decisions. | Deferred | Each needs its own product, security, legal, operational, and abuse evidence. |
| FS-D-020 | `https://github.com/kevinelliott/fry-signal` is publication authority; only verified remote `main` states can become snapshots. | Adopted foundation | Branches, PRs, CI, previews, and local commits are not snapshots. After merge, verify the remote `main` SHA, sync the canonical checkout, rerun claimed gates, and publish any snapshot tag/release record to that repository. |

## Decision conflicts resolved

The following earlier proposals are explicitly superseded:

- six direct verbs including routine pack and send;
- mobile `Forecast / Batch / Route / Pack / Go` task-page navigation;
- a positive recovery score category;
- a forced scored equipment failure as the recovery tutorial;
- Postgres/server authority as a Gate 1 dependency;
- two initial onchain asset classes;
- broad cast/menu content in the first vertical.

Current foundation branch or PR work is not a snapshot and must not be reported as one before merge and remote-`main` verification.

## Evidence

- Product foundation: `../PRODUCT.md`.
- Final independent reconciliation: Buzz event `27ca0bd235c7e5af1856e3f57c0dce739d50c482e426ac7546aeeede232da3fb`.
- Local/server authority clarification: Buzz event `92631d2a828ffa22b21f921dd24f0b6e3e05cf55d7c4a88e4cf4c3235066fcc8`.
