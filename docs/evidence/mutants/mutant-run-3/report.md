# Adversyn conformance report

- Target: https://altmempoolgateway.forshtat.com/rpc
- Policy: erc-8421-static:erc-8421@74a868cd
- Generated: 2026-11-06T15:36:24.144Z
- Results: 1 scenarios, 0 pass, 1 findings, 0 inconclusive, 0 errors

| Scenario | Result | Predicted | Observed | Stage |
|---|---|---|---|---|
| valid-self-verify.atomic-flag.8f8946c4 | FINDING | accept | reject | other |

## Findings

### Node rejected a transaction for an unrecognised reason

- Scenario: valid-self-verify.atomic-flag.8f8946c4
- Class: no-oracle, status: anomaly, severity: low
- Fingerprint: `337d6f48991d03c96c51b78e4dd9555c0758a8ce68e3e1a0df69f43f68e1469d`
- node said: Frame 1: atomic batch flag on last frame

