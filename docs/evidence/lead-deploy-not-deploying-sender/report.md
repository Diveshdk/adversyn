# Adversyn conformance report

- Target: https://altmempoolgateway.forshtat.com/rpc
- Policy: erc-8421-static:erc-8421@74a868cd
- Generated: 2026-11-06T10:02:28.853Z
- Results: 1 scenarios, 0 pass, 1 findings, 0 inconclusive, 0 errors

| Scenario | Result | Predicted | Observed | Stage |
|---|---|---|---|---|
| invalid-stray-default-frame | FINDING | reject (PREFIX-010, PREFIX-120) | accept | admitted |

## Findings

### Node admitted a transaction the policy rejects (PREFIX-010, PREFIX-120)

- Scenario: invalid-stray-default-frame
- Class: conformance, status: violation, severity: high
- Fingerprint: `9997f967535981f1d4f2030648a0bfc41fff31b5fee2bd51c254342e22a9738b`

