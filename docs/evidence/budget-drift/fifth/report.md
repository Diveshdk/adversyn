# Adversyn conformance report

- Target: https://altmempoolgateway.forshtat.com/rpc
- Policy: erc-8421-static:erc-8421@74a868cd
- Generated: 2026-11-06T03:58:03.500Z
- Results: 14 scenarios, 8 pass, 0 findings, 6 inconclusive, 0 errors

| Scenario | Result | Predicted | Observed | Stage |
|---|---|---|---|---|
| valid-self-verify | PASS | accept | accept | solvency |
| valid-only-verify-pay | INCONCLUSIVE | accept | unknown | skipped |
| valid-pre-verify | INCONCLUSIVE | accept | unknown | skipped |
| invalid-lone-only-verify | PASS | reject (PREFIX-010) | reject (PREFIX-010) | static |
| invalid-deploy-not-first | PASS | reject (PREFIX-010, PREFIX-020) | reject (PREFIX-010) | static |
| invalid-atomic-in-prefix | PASS | reject (PREFIX-040) | reject (PREFIX-040) | static |
| invalid-verify-after-prefix | PASS | reject (PREFIX-050) | reject (PREFIX-050) | static |
| invalid-expired-expiry | INCONCLUSIVE | reject (PREFIX-080) | unknown | skipped |
| valid-future-expiry | INCONCLUSIVE | accept | unknown | skipped |
| invalid-stray-default-frame | INCONCLUSIVE | reject (PREFIX-010, PREFIX-120) | accept | solvency |
| invalid-budget-unstaked | PASS | reject (BUDGET-010) | reject (BUDGET-010) | static |
| valid-budget-staked | INCONCLUSIVE | accept | unknown | skipped |
| boundary-budget-97200 | PASS | accept | accept | solvency |
| boundary-budget-97201 | PASS | reject (BUDGET-010) | reject (BUDGET-010) | static |

## Notes

- valid-only-verify-pay: skipped: needs a deployed contract (paymaster, wallet, ...) that Adversyn does not deploy yet
- valid-pre-verify: skipped: needs a deployed contract (paymaster, wallet, ...) that Adversyn does not deploy yet
- invalid-expired-expiry: skipped: frame 0: role expiry_verify needs verifier/factory details not mapped yet
- valid-future-expiry: skipped: frame 0: role expiry_verify needs verifier/factory details not mapped yet
- invalid-stray-default-frame: node stopped at the solvency check; PREFIX-010, PREFIX-120 depends on simulation or frame classification and may not have been evaluated yet. Re-run with a funded key (ADVERSYN_PRIVATE_KEY).
- valid-budget-staked: skipped: needs staked entities; staking is not arranged by Adversyn
