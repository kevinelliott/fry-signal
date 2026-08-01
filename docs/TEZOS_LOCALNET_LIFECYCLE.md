# Tezos Localnet lifecycle

Fry Signal is currently specification only with respect to Tezos. The Phase 1 game has no wallet SDK, RPC client, indexer, contract, deployment, or ownership operation. Its complete first shift runs locally and network-free.

## Adoption boundary

Before chain-dependent code lands:

- ordinary chain development, deployment, and integration commands must select Localnet explicitly;
- Localnet must use loopback `http://127.0.0.1:8732`, chain `NetXtJqPyJGB6Pc`, and no public indexer;
- server and browser-visible environment values must match exactly;
- Shadownet must use an explicit promotion command and verify `NetXsqzbfFenSTS` before signing or deployment;
- Mainnet must have no development command or implicit fallback;
- missing, unknown, conflicting, or mismatched network authority must stop startup;
- addresses, artifacts, identities, and manifests must remain project- and environment-scoped;
- a shared Localnet reset invalidates Fry Signal manifests and requires re-origination before evidence can be fresh again.

## Current profile checks

From this repository:

```bash
pnpm tezos:localnet
pnpm tezos:shadownet
```

These are read-only profile/chain-identity checks supplied by the shared sibling runtime. They are not deployment, contract, wallet, or authenticated-journey evidence.

## Future lifecycle

The first adopted ownership path must document and separately verify:

1. shared consumer conformance and a fresh Fry Signal namespace;
2. reproducible contract compilation and exact project manifest;
3. Localnet origination, claim, confirmation, receipt inspection, install, unlink, and relink;
4. reset impact, stale-manifest rejection, and successful return to Localnet;
5. an exact clean Shadownet candidate with account/network/scope drift, duplicate intent, indexer lag, and reorg handling;
6. no Mainnet availability until a separately authorized release gate.

Local tests and builds, registered manifest evidence, a running deployment, an authenticated wallet journey, Shadownet rehearsal, and Mainnet readiness are distinct proofs and must be reported separately.
