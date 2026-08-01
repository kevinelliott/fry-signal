# Fry Signal

**See the wave. Commit the batch. Throw the switch. Save the wrong turn. Light the sign.**

Fry Signal is a walletless-first traffic-routing restaurant game set at Mile 42, a dependable late-night fried-chicken stop on an old bypass. The first playable vertical is a deterministic, local web game about reading announced traffic waves, committing batch posture, changing route topology, and recovering exceptions without turning speed, profit, or token ownership into the promise.

## Repository state

This foundation is pre-release. It contains no deployed contract, authenticated chain journey, production service, or Mainnet configuration. Gameplay authority is local and offchain. Tezos ownership remains a separately gated future phase.

## Workspace

```text
apps/web/          responsive Next.js player surface
packages/domain/   pure deterministic shift reducer and fixtures
docs/              product, architecture, economy, security, and delivery contracts
```

## Commands

```bash
pnpm install
pnpm dev
pnpm test:all
pnpm test:e2e
```

The first vertical intentionally performs no wallet, RPC, indexer, or network request. The shared Tezos profiles can be verified independently with `pnpm tezos:localnet` and `pnpm tezos:shadownet`; they are not gameplay prerequisites.

## Product boundary

- Core verbs: **read → commit → switch → recover**.
- Ordinary packing and dispatch visualize routing consequences; manual actions surface only for exceptions.
- Service Signal leads the debrief. The House Book explains sustainable restaurant health afterward.
- Fair staffing, breaks, and safe equipment limits are fixed commitments, never optimization levers.
- Profit remains an offchain restaurant-health constraint. It has no ticker, cash-out, APY, public ranking, or effect on future ownership.
- Wallet linkage, keepsakes, contracts, marketplace behavior, and cross-title assets are deferred until the walletless game proves fun.

See [PRODUCT.md](PRODUCT.md) and the documents in [docs](docs) for the normative foundation.
