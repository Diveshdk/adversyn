# Adversyn conformance report

- Target: https://altmempoolgateway.forshtat.com/rpc
- Policy: erc-8421-static:erc-8421@74a868cd
- Generated: 2026-11-06T15:10:26.791Z
- Results: 2 scenarios, 1 pass, 1 findings, 0 inconclusive, 0 errors

| Scenario | Result | Predicted | Observed | Stage |
|---|---|---|---|---|
| invalid-budget-unstaked | FINDING | reject (BUDGET-010) | accept | solvency |
| boundary-budget-97200 | PASS | accept | accept | solvency |

## Findings

### Node's static checks passed a transaction the policy rejects (BUDGET-010)

- Scenario: invalid-budget-unstaked
- Class: conformance, status: violation, severity: medium
- Fingerprint: `b416f0359a46ddde05161a713fccb285058a047cd716e5fe3f5191f2c2d42e1e`
- node stopped at solvency; this rule was not enforced before it
- node said: validation frame 0: the payer 0x47ba395bdd67e53a15cad26f492312bb66e34936 has 0 wei, the transaction's maximum cost is 232728000000000 wei

