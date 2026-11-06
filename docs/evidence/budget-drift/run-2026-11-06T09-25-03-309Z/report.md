# Adversyn conformance report

- Target: https://altmempoolgateway.forshtat.com/rpc
- Policy: erc-8421-static:erc-8421@74a868cd
- Generated: 2026-11-06T09:25:13.746Z
- Results: 14 scenarios, 6 pass, 2 findings, 6 inconclusive, 0 errors

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
| invalid-budget-unstaked | FINDING | reject (BUDGET-010) | accept | solvency |
| valid-budget-staked | INCONCLUSIVE | accept | unknown | skipped |
| boundary-budget-97200 | PASS | accept | accept | solvency |
| boundary-budget-97201 | FINDING | reject (BUDGET-010) | accept | solvency |

## Findings

### Node's static checks passed a transaction the policy rejects (BUDGET-010)

- Scenario: invalid-budget-unstaked
- Class: conformance, status: violation, severity: medium
- Fingerprint: `b416f0359a46ddde05161a713fccb285058a047cd716e5fe3f5191f2c2d42e1e`
- node stopped at solvency; this rule was not enforced before it
- node said: validation frame 0: the payer 0x6aa890c1fd94fd1063290120020e50ccb20e801c has 0 wei, the transaction's maximum cost is 232704000000000 wei

### Node's static checks passed a transaction the policy rejects (BUDGET-010)

- Scenario: boundary-budget-97201
- Class: conformance, status: violation, severity: medium
- Fingerprint: `dbca94d86cc589d9f83f4616814590b0ebc75b2441983285851c2877ea720607`
- node stopped at solvency; this rule was not enforced before it
- node said: validation frame 0: the payer 0xfeac1b3e0152fa01e4b16c11b49edac87dba4765 has 0 wei, the transaction's maximum cost is 227128000000000 wei


## Notes

- valid-only-verify-pay: skipped: needs a deployed contract (paymaster, wallet, ...) that Adversyn does not deploy yet
- valid-pre-verify: skipped: needs a deployed contract (paymaster, wallet, ...) that Adversyn does not deploy yet
- invalid-expired-expiry: skipped: frame 0: role expiry_verify needs verifier/factory details not mapped yet
- valid-future-expiry: skipped: frame 0: role expiry_verify needs verifier/factory details not mapped yet
- invalid-stray-default-frame: node stopped at the solvency check; PREFIX-010, PREFIX-120 depends on simulation or frame classification and may not have been evaluated yet. Re-run with a funded key (ADVERSYN_PRIVATE_KEY).
- valid-budget-staked: skipped: needs staked entities; staking is not arranged by Adversyn
