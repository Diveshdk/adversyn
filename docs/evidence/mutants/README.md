# Generated mutants executed against the devnet

Baseline: `valid-self-verify`, admitted by the sidecar (tx `0x430ef7075e47898eb79f6581ef84a586da9a88ffd1c5fd1585dee49e78b73854`, see `../README.md`).

Mutants are from `scenarios/generated/` (manifest `scenarios/generated/manifest.json`). Predictions come from the static policy and are not observations.

| Mutant | Change | Predicted | Observed | Run folder |
|---|---|---|---|---|
| `valid-self-verify.gas-boundary.9a97a593` | frame 0 gas 30,000 to 97,201 | reject (BUDGET-010) | admitted, tx `0x39d39f8c4ee70ae174aa47630f7726c4c67a9540ac25df97416fea29408b8a9e` | `../budget-drift/mutant-run-1` |
| `valid-self-verify.atomic-flag.9172d677` | atomic flag on frame 0 | reject (PREFIX-040) | reject (PREFIX-040), static stage | `mutant-run-2c` |
| `valid-self-verify.atomic-flag.8f8946c4` | atomic flag on frame 1 (last frame) | accept | reject, stage other | `mutant-run-3` |

## Results

1. **gas-boundary.9a97a593.** The mismatch is explained by the devnet maintainer removing the gas limits that day. See `../budget-drift/README.md`. Not a vulnerability.
2. **atomic-flag.9172d677.** The prediction matched. The node said: "frame 0 in validation prefix has ATOMIC_BATCH_FLAG set".
3. **atomic-flag.8f8946c4.** The prediction did not match. The node said: "Frame 1: atomic batch flag on last frame". The analyzer classed it as an unrecognised rejection (class no-oracle, low severity). EIP-8141 (Frame Transaction, Constraints) says the atomic batch flag "requires a subsequent non-VERIFY frame to batch with" and marks the last frame as not allowed to carry it. The node's rejection is consistent with that rule. The static policy encodes ERC-8421 rules only and does not include this EIP-8141 constraint, so this is a gap in the policy's predictions, not a node bug.

## Not claimed

- No result here is a confirmed vulnerability.
- Predictions are structural only. Rules the policy does not evaluate are listed per case in the manifest.

## Follow-up

Add the EIP-8141 atomic batch constraints (not on the last frame, not on VERIFY frames, next frame must not be VERIFY) to the policy as an explicit, documented rule, then regenerate the manifest.
