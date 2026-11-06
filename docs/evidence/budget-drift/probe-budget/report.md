# Adversyn conformance report

- Target: https://altmempoolgateway.forshtat.com/rpc
- Policy: erc-8421-static:erc-8421@74a868cd
- Generated: 2026-11-06T15:15:07.191Z
- Results: 3 scenarios, 0 pass, 3 findings, 0 inconclusive, 0 errors

| Scenario | Result | Predicted | Observed | Stage |
|---|---|---|---|---|
| probe-budget-1000000 | FINDING | reject (BUDGET-010) | accept | solvency |
| probe-budget-10000000 | FINDING | reject (BUDGET-010) | accept | solvency |
| probe-budget-1000001 | FINDING | reject (BUDGET-010) | accept | solvency |

## Findings

### Node's static checks passed a transaction the policy rejects (BUDGET-010)

- Scenario: probe-budget-1000000
- Class: conformance, status: violation, severity: medium
- Fingerprint: `4b79fc99cb5ad916cf716aaad5b428ffb59012a8a177a2fd9fed8228c9faab05`
- node stopped at solvency; this rule was not enforced before it
- node said: validation frame 0: the payer 0x36600aa118fc029002ecc3eafbf3ade16af4864e has 0 wei, the transaction's maximum cost is 2032702000000000 wei

### Node's static checks passed a transaction the policy rejects (BUDGET-010)

- Scenario: probe-budget-10000000
- Class: conformance, status: violation, severity: medium
- Fingerprint: `ea8af92e65a82b43abd9002f2b362efb2f667d1a3f604eb594d303697fc64552`
- node stopped at solvency; this rule was not enforced before it
- node said: validation frame 0: the payer 0x6f9f3bd9024dd8d9eb935775110ca3a5a14834e5 has 0 wei, the transaction's maximum cost is 20032726000000000 wei

### Node's static checks passed a transaction the policy rejects (BUDGET-010)

- Scenario: probe-budget-1000001
- Class: conformance, status: violation, severity: medium
- Fingerprint: `5335164748ce5ac482c6ff88b28cd31630d9aa4d5fdba7e29e1fdbbd41d5e812`
- node stopped at solvency; this rule was not enforced before it
- node said: validation frame 0: the payer 0x30f26d0265b3729cb42ca6ff76e4980e5badab2f has 0 wei, the transaction's maximum cost is 2032680000000000 wei

