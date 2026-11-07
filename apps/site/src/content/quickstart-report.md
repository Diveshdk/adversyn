# Adversyn conformance report

- Target: https://altmempoolgateway.forshtat.com/rpc
- Policy: erc-8421-static:erc-8421@74a868cd
- Generated: <timestamp>
- Results: 3 scenarios, 3 pass, 0 findings, 0 inconclusive, 0 errors

| Scenario | Result | Predicted | Observed | Stage |
|---|---|---|---|---|
| valid-self-verify | PASS | accept | accept | solvency |
| invalid-atomic-in-prefix | PASS | reject (PREFIX-040) | reject (PREFIX-040) | static |
| invalid-verify-after-prefix | PASS | reject (PREFIX-050) | reject (PREFIX-050) | static |

## Notes

- invalid-atomic-in-prefix: node said: frame 0 in validation prefix has ATOMIC_BATCH_FLAG set
- invalid-verify-after-prefix: node said: frame 1 is a VERIFY frame after the validation prefix (ends at index 0)
