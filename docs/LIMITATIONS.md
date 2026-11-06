# Known limitations and open questions

State as of 2026-11-06. Nothing here is a confirmed vulnerability.

## Spec pin

- The policy is tagged `erc-8421@74a868cd`. That commit is not in the `pr-clean` branch of forshtat/ERCs (checked 2026-11-06: the file has five commits there, from 2026-09-29, head `493ba8a`, 2026-10-01).
- Between the first commit (`8da5b7f`) and the head, no changed line mentions PREFIX-, BUDGET-, MAX_VERIFY, SIGNATURE-010, deploy, pre_verify or expiry_verify, and the PREFIX and BUDGET rule ids are the same. The encoded rules therefore match every version on that branch.
- The tag has not been changed. Re-pinning to `493ba8a` is a separate, explicit change (it rewrites `provenance.policy` in the generated scenarios and the manifest).

## Open spec questions (for the maintainers)

- **PREFIX-020, third clause.** The spec says the deploy frame MUST result in a successful deployment of `tx.sender`. The policy checks only that the deploy frame is first and unique. A transaction whose first frame (default mode, empty data, target labelled "Factory" by the explorer) deploys nothing was admitted and mined (`docs/evidence/`, transaction B). Does admission check that clause?
- **PREFIX-100.** Frames targeting default-code accounts are exempt from alt-mempool rules. Does that exemption apply to a deploy frame whose target has code?

Scenarios that exercise an unevaluated rule are reported as inconclusive, never as passes or findings.

## Rules the policy does not evaluate

SIGNATURE-010, the PREFIX-020 deploy clause, PREFIX-060, PREFIX-100, PREFIX-110, OPCODES-*, CREATION-010, CALLING-*, STORAGE-*, SOLVENCY-*, REPUTATION-*, LIFECYCLE-*, LOCAL-*. A predicted "accept" means no static violation was found, not that a node will accept it.

The policy also encodes ERC-8421 only. EIP-8141's own constraints are missing. Example found by a generated mutant: the atomic batch flag is not allowed on the last frame. The node rejected it ("Frame 1: atomic batch flag on last frame") while the policy predicted accept (`docs/evidence/mutants/`). Follow-up: add the EIP-8141 atomic batch constraints as an explicit rule and regenerate the manifest.

## Devnet behaviour changed

On 2026-11-06 the devnet maintainer restarted the devnet without gas limits. BUDGET-010 behaviour measured earlier that day (97,200 accepted, 97,201 rejected) no longer reproduces; the earlier runs are preserved in `docs/evidence/budget-drift/`. Unfunded probes only reach the solvency check, so they show nothing about later stages. The gateway keeps admission reports in memory and may restart, so behaviour should always be quoted with a date.

## Unsupported scenario features

Staking, deployed contracts (paymasters, wallets), and the expiry verifier are not arranged by Adversyn. Scenarios needing them are skipped. Role mutations that do not change the compiled transaction are skipped as label-only, so mutations involving `deploy` and `pre_verify` cannot be tested on a live node.

## Evidence gaps

- The hash of the first `valid-self-verify` admission was not captured (hashes were not recorded until later that day).
- When captured, transaction A was still pending ("New") in the explorer. Only transaction B was seen on chain.
- Passing results recorded before the notes change keep the rule id but not the node's raw text.
