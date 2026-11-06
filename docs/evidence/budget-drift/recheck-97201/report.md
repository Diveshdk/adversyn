# Adversyn conformance report

- Target: https://altmempoolgateway.forshtat.com/rpc
- Policy: erc-8421-static:erc-8421@74a868cd
- Generated: 2026-11-06T15:08:18.445Z
- Results: 1 scenarios, 0 pass, 1 findings, 0 inconclusive, 0 errors

| Scenario | Result | Predicted | Observed | Stage |
|---|---|---|---|---|
| boundary-budget-97201 | FINDING | reject (BUDGET-010) | accept | solvency |

## Findings

### Node's static checks passed a transaction the policy rejects (BUDGET-010)

- Scenario: boundary-budget-97201
- Class: conformance, status: violation, severity: medium
- Fingerprint: `dbca94d86cc589d9f83f4616814590b0ebc75b2441983285851c2877ea720607`
- node stopped at solvency; this rule was not enforced before it
- node said: validation frame 0: the payer 0xc0253cd14fc5d7c6ce0e05893cbb699e233ae7ab has 0 wei, the transaction's maximum cost is 227128000000000 wei

