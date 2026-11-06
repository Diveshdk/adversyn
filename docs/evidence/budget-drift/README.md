# Verification-gas budget: node behaviour changed during the event

All times are result-file modification times (UTC), 2026-11-06. IST is UTC+05:30.

## What was observed

Unfunded throwaway keys, public devnet gateway (chain 1337):

| Run folder | Time (UTC) | boundary-budget-97201 | invalid-budget-unstaked (100,001 gas) |
|---|---|---|---|
| `fifth` (last of the earlier runs) | 03:58 | reject, static stage, BUDGET-010 | reject, static stage, BUDGET-010 |
| `run-2026-11-06T09-25-03-309Z` | 09:25 | accept, stopped at solvency | accept, stopped at solvency |
| `recheck-97201`, `recheck-budget` | 15:08, 15:10 | accept, stopped at solvency | accept, stopped at solvency |
| `probe-budget` | 15:15 | 1,000,000 / 1,000,001 / 10,000,000 gas: all accept, stopped at solvency | |

Runs `smoke`, `first`, `second`, `third` and `fourth` (03:04 to 03:48 UTC) also rejected both values at the static stage. They are not copied here.

Funded key, 15:04 UTC (20:34 IST): `valid-self-verify.gas-boundary.9a97a593` (frame 0 at 97,201 gas) was admitted, tx `0x39d39f8c4ee70ae174aa47630f7726c4c67a9540ac25df97416fea29408b8a9e`. The explorer shows frame 0 gas limit 97,201 and an admission report in which every rule passed. Run folder: `mutant-run-1`.

## Original node wording

Recorded in `packages/analyzer/src/reasons.ts` from the earlier behaviour:
"validation prefix execution gas sum 100001 + signature-verification cost 2800 = 102801 exceeds MAX_VERIFY_GAS 100000".
Passing entries in `results.json` keep the verdict and rule id but not the raw node text.

## What this does and does not show

- The node accepts, at the stage where it used to reject, values above 100,000 gas for an unstaked sender, including values above the 1,000,000 staked cap.
- The change happened between the `fifth` run and the 09:25 UTC run, and it predates every funded run, so the funded account is not the cause.
- Unfunded probes stop at the solvency check, so they do not show whether the limit is enforced at a later stage. The one funded observation (97,201 admitted) is the only evidence past that point.
- The cause is unknown. It may be an intended node or configuration change.
- This is not a confirmed vulnerability. The ERC-8421 draft text read on 2026-11-06 still says unstaked entities MUST NOT exceed MAX_VERIFY_GAS_PER_ENTITY (100,000) and that signature cost counts toward the sender.

## Open question for the maintainers

Was the sidecar updated or reconfigured on 2026-11-06? What is the intended unstaked per-entity limit now, and is the signature cost still counted toward the sender?
