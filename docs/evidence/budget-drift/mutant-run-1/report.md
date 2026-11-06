# Adversyn conformance report

- Target: https://altmempoolgateway.forshtat.com/rpc
- Policy: erc-8421-static:erc-8421@74a868cd
- Generated: 2026-11-06T15:03:51.462Z
- Results: 1 scenarios, 0 pass, 1 findings, 0 inconclusive, 0 errors

| Scenario | Result | Predicted | Observed | Stage |
|---|---|---|---|---|
| valid-self-verify.gas-boundary.9a97a593 | FINDING | reject (BUDGET-010) | accept | admitted |

## Findings

### Node admitted a transaction the policy rejects (BUDGET-010)

- Scenario: valid-self-verify.gas-boundary.9a97a593
- Class: conformance, status: violation, severity: high
- Fingerprint: `9c1167775732e58b5c3aea3d0ea6ae94ebf169a9ce984ecd908ad7db64e24376`

