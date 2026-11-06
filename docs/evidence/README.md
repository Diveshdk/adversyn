# Live devnet evidence

Captured 2026-11-06 against the public ERC-8421 devnet.

## Network

- Gateway RPC: https://altmempoolgateway.forshtat.com/rpc
- Chain id: 1337
- Explorer: https://explorer.altmempool.wtf/ (instance "Gateway", Sidecar v4.1.1, manual bundling, p2p on)
- Sender (as shown by the explorer): 0xFe9a...374A

## Transactions

| | A: valid-self-verify | B: lead-deploy-not-deploying-sender |
|---|---|---|
| Hash | `0x430ef7075e47898eb79f6581ef84a586da9a88ffd1c5fd1585dee49e78b73854` | `0xfcbd6c9fd229b589d14a09e871aa73f3a2ecafb226630b2a00da005d6fe3533f` |
| Adversyn result | PASS, admitted | admitted (reported as a FINDING at the time, later reclassified, see below) |
| Explorer status when captured | New (in the pool, not mined), about 9 minutes after first seen | On chain |
| Admission report | "Every rule passed" (gas-limit, recent-root, prefix, structure, signature, simulation, trace-alignment, OP-061, execution, mempool) | Not available: the node keeps reports in memory and clears them on restart |
| Nonce | 2 | not captured |
| First seen / admitted | 20:20:01.889 / 20:20:02.892 (times as displayed by the explorer) | not captured |
| Frames | 0: self-verification, verify mode, 30,000 gas, approves execution and payment. 1: sender mode, target 0x8943...a776, 50,000 gas, 200,000 state gas, 1,000,000,000 wei | 0: default mode, target 0x8943...a776 (the explorer labels it "Factory"), 5,000 gas. 1: self-verification, verify mode, 30,000 gas |
| Explorer link | https://explorer.altmempool.wtf/tx/0x430ef7075e47898eb79f6581ef84a586da9a88ffd1c5fd1585dee49e78b73854?node=https%3A%2F%2Faltmempoolgateway.forshtat.com%2Frpc | https://explorer.altmempool.wtf/tx/0xfcbd6c9fd229b589d14a09e871aa73f3a2ecafb226630b2a00da005d6fe3533f?node=https%3A%2F%2Faltmempoolgateway.forshtat.com%2Frpc |
| Adversyn run files | `valid-self-verify/` | `lead-deploy-not-deploying-sender/` |
| Screenshot | `explorer-valid-self-verify.png` | `explorer-lead-deploy.png` |

"Admitted" means the node accepted the transaction into its pool. Only transaction B was seen on chain.

## What is not captured

- `valid-self-verify` was admitted once earlier the same day, before Adversyn recorded transaction hashes. That hash was not saved and is not claimed here. Transaction A is a later re-run of the same scenario.
- Transaction B was run under its earlier id `invalid-stray-default-frame`. Its run files in this folder use that id. The scenario was renamed afterwards because the original PREFIX-010 / PREFIX-120 attribution was wrong (those rules depend on a role label that never reaches the wire).

## Status of transaction B

Not a confirmed vulnerability. Open questions for the maintainers:

- PREFIX-020: "The deploy frame MUST result in a successful deployment of the tx.sender contract." Frame 0 here has empty data and zero value, so it deploys nothing. Does admission check that clause?
- PREFIX-100: does the exemption for default-code targets apply to this frame, given the explorer labels the target a factory?

Adversyn's static policy does not evaluate the PREFIX-020 clause, so reports mark such scenarios inconclusive.

## Reproduce

Needs a funded devnet key in `ADVERSYN_PRIVATE_KEY`. Never commit it.

    pnpm adversyn run --only valid-self-verify --out out/evidence-valid

A new run sends a new transaction, so its hash will differ. The CLI prints the hash for admissions. Look it up with the explorer URL pattern above.
