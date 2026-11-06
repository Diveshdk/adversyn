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
- Cause: the devnet maintainer restarted the devnet "without any gas limits" (EthGlobal 26 Alt-mempool Telegram group, message from Alex Forshtat at 1:06 PM, after another team reported the flat 100,000 MAX_VERIFY_GAS cap rejecting their transaction). This is a deliberate devnet configuration change. It is not a node bug or a vulnerability. The gateway may have been restarted more than once since.
- This is not a confirmed vulnerability. The ERC-8421 draft text read on 2026-11-06 still says unstaked entities MUST NOT exceed MAX_VERIFY_GAS_PER_ENTITY (100,000) and that signature cost counts toward the sender.

## Consequence

BUDGET-010 cannot be tested on this devnet while the limit is removed. The earlier saved runs are the evidence that the rule was enforced earlier that day. Verification-gas behaviour should always be described with a date.

## Probe size

One probe (`probe-budget-10000000`) used a 10,000,000 gas verification frame from an unfunded throwaway key. It was sent before we had seen the maintainer's request not to send 10+ million gas verifications. It stopped at the solvency check and was not admitted. No further probes of that size were sent.
