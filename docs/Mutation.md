# Scenario mutation

`adversyn mutate` generates controlled variants of existing scenarios, offline and deterministically. It needs no devnet and no funded account.

Generated scenarios are **candidates for testing**. They are not findings, and they are not confirmed vulnerabilities. Nothing is sent to a node by this command.

## Specification, prediction, observation

Three things stay separate throughout:

| | Where it comes from | Where it lives |
|---|---|---|
| **Specification** | The ERC-8421 rules, encoded in `@adversyn/policy` and pinned (`erc-8421@74a868cd`) | Policy rules |
| **Prediction** | `predict()` applied to a generated scenario | `manifest.json`, per case |
| **Observation** | What a real node said when the scenario was submitted | Only produced by `adversyn run` |

A prediction is never an observation. A mutant that the policy predicts will be rejected has not been rejected by anything yet.

One value in the policy is **measured, not specified**: the sidecar counts 2,800 gas for a secp256k1 signature toward the sender's verification budget (`SECP256K1_VERIFY_COST_OBSERVED`). ERC-8421 names that cost but gives no number. The manifest records it as `sigVerifyCostObserved`, separately from the policy version.

## Usage

```bash
pnpm adversyn mutate [dir] [options]
```

| Option | Meaning |
|---|---|
| `[dir]` | Seed scenario directory (default `scenarios/examples`) |
| `--only <ids>` | Comma-separated seed scenario ids (default: all) |
| `--operators <ids>` | Comma-separated operator ids (default: all) |
| `--max <n>` | Maximum number of generated scenarios |
| `--now <unixSec>` | Time used by time-dependent policy rules. Default: the current time, recorded in the manifest |
| `--out <dir>` | Output directory (default `out/mutants`) |
| `--overwrite` | Overwrite files from a previous run in `--out` |

Output:

```
<out>/manifest.json
<out>/scenarios/<id>.yaml
```

Run the generated scenarios with the existing command:

```bash
pnpm adversyn run <out>/scenarios
```

### Determinism

Identical inputs produce byte-identical output. The manifest contains no generation timestamp. `--now` is an input and is recorded, so re-running with the same value reproduces the output. Seeds are processed in the order given, operators in registry order, candidates in generated order.

With `--max`, generation stops after `n` scenarios in that order, so early seeds and operators fill the budget first. It is not balanced across operators. Use `--operators` or `--only` to spread coverage deliberately. `truncated` in the manifest counts candidates not evaluated because the limit was reached.

### Overwrite behaviour

The command refuses to write if any target file already exists, unless `--overwrite` is given. `--overwrite` only replaces files it is about to write and never deletes anything. If you change options between runs, files from the earlier run may remain, so use a new `--out`.

## Provenance

Every generated scenario carries a `provenance` block:

| Field | Meaning |
|---|---|
| `parentId` | The seed scenario's id |
| `parentContentHash` | Content hash of the seed at generation time |
| `operator` | The operator that produced it |
| `field` | The field changed, for example `frames[0].limits.execution` |
| `original` / `mutated` | Value before and after (`null` where a frame was absent) |
| `policy` | Policy version used for the prediction |
| `generation` | Generator name and version |

Other properties of generated scenarios:

- **ID:** `<parentId>.<operator>.<first 8 hex of the content hash>`. The suffix is extended if that id is taken. The id cannot collide with any seed or other existing scenario.
- **Content hash:** covers exactly what is compiled and sent (sender, nonce, fees, signature mode, stake, frames), so id, title, tags, expectation and provenance do not affect it. A mutant with the same content as an existing scenario is skipped as a duplicate.
- **No inherited expectation.** The parent's `expect` block is dropped, because it described the parent. Predictions come from the policy.
- **The parent is never modified.** Mutants are built from deep copies.
- Title gets the operator appended, and tags gain `mutant` and `op:<operator>`.

## Pipeline

For each seed, for each operator, for each candidate:

1. **Build:** deep-copy the seed, apply the change, add provenance, assign the id, validate against the schema. No-ops and duplicates are skipped here.
2. **Compile check:** run the real `compileScenario()` offline with a throwaway key that is never submitted. Anything the compiler cannot build is skipped with the compiler's own message. This guarantees every emitted scenario can later be sent by the executor.
3. **Predict:** call `predict()` and store the verdict, violated rule ids and unevaluated rules.

Only scenarios that pass all three count toward `--max`. Every skip is reported with its seed, operator, field and reason, in the console (first 15) and in full in the manifest.

## Operators

| Id | What it does |
|---|---|
| `gas-boundary` | For each frame whose role the policy counts toward verification gas, set `limits.execution` to the last value the policy accepts and the first it rejects for `BUDGET-010` |
| `frame-order` | Swap each pair of adjacent frames |
| `frame-remove` | Remove one frame at a time |
| `frame-duplicate` | Insert a copy of one frame immediately after itself |
| `role` | Change a frame's role, but only where that changes the compiled transaction |
| `atomic-flag` | Toggle the atomic batch flag on one frame at a time |

### gas-boundary

The boundary is found by binary search against the policy, not hardcoded. It therefore follows the policy's constants: the per-entity cap (100,000 unstaked, 1,000,000 staked), whether the entity is staked in the seed, and the measured signature cost, which applies to the sender only. For an unstaked sender the boundary is currently 97,200 (accepted) and 97,201 (rejected), but that follows from the measured constant, so it moves if the constant changes.

Skipped with a reason: frames whose role the policy does not count; frames where the scenario is already over budget because of another entity (lowering this frame cannot fix it); frames where the policy reports no violation up to the search ceiling (10,000,000).

### frame-order

Adjacent swaps only. Skipped: single-frame seeds, and swaps involving `expiry_verify` (the compiler cannot map it yet). Swapping identical frames is a no-op and is skipped by the build stage.

### frame-remove and frame-duplicate

There is deliberately no operator that inserts new frames. A new frame needs a target and gas values, and choosing them would be inventing content. Duplicating an existing frame reuses content that already exists in the seed.

`frame-remove` skips single-frame seeds, since the schema needs at least one frame. `frame-duplicate` skips `expiry_verify` frames. The 64-frame limit is enforced by the schema, so duplicates that would exceed it are skipped at the build stage with the schema's message.

### role

In the compiler, a role reaches the transaction in one place only: the approve scope of a `VERIFY` frame (`self_verify` is execution and payment, `only_verify` is execution, `pay` is payment; any other role gets the default). The operator emits only role changes that change that scope.

Role changes that leave the compiled bytes identical, such as `self_verify` to `deploy`, or any role change on a `SENDER` frame, are skipped as **label-only**. A node cannot distinguish them, so the policy's changed prediction would be untestable and could only produce misleading mismatches. The consequence is that role mutations involving `deploy` and `pre_verify` cannot be generated for a live node at present.

### atomic-flag

Toggles the flag on each frame. The flag is a real wire change. The policy only has `PREFIX-040` (no flag on validation prefix frames). Toggling the flag on a body frame is therefore predicted as accept, with the other rules listed as unevaluated. If a node rejects such a variant, that is an unattributed rejection to investigate, not a confirmed violation.

## Limitations

- **The policy covers structural rules only.** `OPCODES-*`, `STORAGE-*`, `CALLING-*`, `CREATION-010`, `SOLVENCY-*`, `REPUTATION-*`, `LIFECYCLE-*` and `LOCAL-*` are not evaluated. A mutant predicted "accept" means no static violation was found, not that a node will accept it.
- **Deliberately not implemented:** invalid-signature mutations, keyed-nonce mutations, and expiry-verifier mutations. The compiler does not support them yet, and the engine skips any scenario containing an `expiry_verify` frame.
- **Staked seeds** produce mutants that carry the stake setting. The executor skips scenarios that need stake, so those mutants are skipped when run.
- **Unfunded runs stop at the solvency check.** Run against the public devnet with throwaway keys, mutants can only reveal behaviour of the rules the node checks before solvency. Others need a funded run.
- **The spec pin is unverified.** The policy is tagged `erc-8421@74a868cd`, but the rule text it was written from has not been compared against that commit.
- **Prediction mismatches are leads, not findings.** The analyzer's safeguards are unchanged. A mismatch between prediction and observation is judged by the existing analyzer, which treats unrecognised wording and later-stage failures as inconclusive.

## Responsible use

Mutants can be numerous. Running them against a shared devnet submits real transactions. Use a small, deliberate subset (`--only`, `--operators`, `--max`), keep the default pacing of `adversyn run`, use fresh throwaway keys, and do not use this to generate mass-rejection traffic. If a run shows a node admitting something the specification forbids, report it to the maintainers before publishing.