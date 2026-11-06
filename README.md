# Adversyn

**Adversarial conformance testing for EIP-8141 Frame Transactions and alternative mempools.**

Adversyn sends crafted Frame Transactions to a real alt-mempool sidecar, records exactly what the node says, and compares that against a versioned policy derived from ERC-8421. Where the node and the spec disagree, Adversyn produces a structured finding. Where it cannot tell, it says so.

```
Generate → Execute → Observe → Analyze → Reproduce → Mitigate → Retest
```

Adversyn is **not** a mempool, an explorer, an EVM, a generic contract auditor, or a replacement for the alt-mempool sidecar. It is the testing and analysis layer around that infrastructure.

> **Status: early.** Built at ETHGlobal Mumbai. The generate → execute → observe → analyze → report loop works end to end against the public alt-mempool devnet. Minimization, differential testing and trace-based rules are not built yet (see [Roadmap](#roadmap)).

## What it found so far

Everything below comes from the public devnet sidecar (`altmempoolgateway.forshtat.com`, chain 1337) on 2026-11-06. A shared devnet can change under you, so behaviour is quoted with dates. Raw run files, screenshots and notes are in [`docs/evidence/`](docs/evidence/README.md). Open questions are in [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md). Nothing here is a confirmed vulnerability.

### Transactions admitted by the sidecar

| Scenario | Result | Explorer |
|---|---|---|
| `valid-self-verify` | admitted; the admission report shows every rule passed; in the pool (status New) when captured | [`0x430ef707…3854`](https://explorer.altmempool.wtf/tx/0x430ef7075e47898eb79f6581ef84a586da9a88ffd1c5fd1585dee49e78b73854?node=https%3A%2F%2Faltmempoolgateway.forshtat.com%2Frpc) |
| `lead-deploy-not-deploying-sender` | admitted and seen on chain; a lead, not a finding (see below) | [`0xfcbd6c9f…533f`](https://explorer.altmempool.wtf/tx/0xfcbd6c9fd229b589d14a09e871aa73f3a2ecafb226630b2a00da005d6fe3533f?node=https%3A%2F%2Faltmempoolgateway.forshtat.com%2Frpc) |

"Admitted" means the sidecar accepted the transaction into its pool. `lead-deploy-not-deploying-sender` has a default-mode first frame that deploys nothing. ERC-8421 PREFIX-020 says the deploy frame must deploy `tx.sender`, and Adversyn's static policy does not encode that clause, so it cannot judge this. It is an open question for the maintainers.

### Rules confirmed enforced by the node

Throwaway unfunded keys, re-checked on the evening of 2026-11-06:

| Rule (ERC-8421) | Node's wording (captured) |
|---|---|
| `PREFIX-010` prefix shape | `frame transaction validation prefix not recognized` |
| `PREFIX-040` no atomic flag in prefix | `frame 0 in validation prefix has ATOMIC_BATCH_FLAG set` |
| `PREFIX-050` no VERIFY after prefix | `frame 1 is a VERIFY frame after the validation prefix (ends at index 0)` |

### Generated mutants

Three mutants of `valid-self-verify` were executed (`adversyn mutate`, then `adversyn run`). One matched its prediction (PREFIX-040). One was explained by a devnet change (below). One exposed a gap in the policy: the node rejected an atomic flag on the last frame, which comes from EIP-8141 and is not an ERC-8421 rule the policy encodes. Details: [`docs/evidence/mutants/`](docs/evidence/mutants/README.md) and [`docs/mutation.md`](docs/mutation.md).

### A measurement that stopped reproducing

On the morning of 2026-11-06 the node enforced `BUDGET-010`: `validation prefix execution gas sum 100001 + signature-verification cost 2800 = 102801 exceeds MAX_VERIFY_GAS 100000`. The sidecar reported 2,800 for a secp256k1 signature, which Adversyn records as an *observed* parameter (not a spec constant). It put the effective limit for an unstaked sender at 97,200 (97,201 was rejected). Later that day the devnet maintainer restarted the devnet without gas limits, and the boundary stopped reproducing. `BUDGET-010` can no longer be tested on this devnet. Before and after runs: [`docs/evidence/budget-drift/`](docs/evidence/budget-drift/README.md).

### Sample report

[`docs/sample-report.md`](docs/sample-report.md) is a historical run from 2026-11-06 03:58 UTC (14 scenarios: 8 pass, 0 findings, 6 inconclusive/skipped), taken before the gas limits were removed. Run it yourself below; the budget scenarios will no longer be rejected on this devnet.

## How it handles uncertainty

The goal is findings you can trust, so Adversyn is deliberately conservative:

- **Observations are facts; findings are judgments.** The executor records what the node said. Only the analyzer decides whether that matches the policy.
- **Policy is versioned, not hardcoded.** Rules are keyed by their ERC-8421 IDs and tagged with the spec commit (`erc-8421@74a868cd`). Nothing is invented where the spec is silent.
- **Unknown wording is never guessed.** A rejection whose text matches no known pattern is `INCONCLUSIVE` (verdict agrees, attribution unknown), never a finding. Every known pattern in [`reasons.ts`](packages/analyzer/src/reasons.ts) records the exact text and the date it was observed.
- **Stage-aware.** An unfunded sender stops at the solvency check, which runs before simulation. Adversyn treats that as proof of the *structural* rules only. A scenario whose predicted violation needs simulation (for example `PREFIX-020`, `PREFIX-120`) is reported as inconclusive until it can be run with a funded key.
- **Honest accounting.** Every report lists skipped scenarios and why.

## Pipeline

```
 scenarios/examples/*.yaml
          │  load + validate (zod)
          ▼
 ┌─────────────────┐   predict()    ┌──────────────────┐
 │  @adversyn/     │───────────────▶│  @adversyn/      │
 │  scenarios      │                │  policy          │
 └────────┬────────┘                │  (ERC-8421 rules)│
          │ compile + sign          └────────┬─────────┘
          ▼                                  │ expected verdict + rule IDs
 ┌─────────────────┐                         │
 │  @adversyn/     │  wire tx                │
 │  protocol       │───────┐                 │
 │ (hegota-support)│       ▼                 │
 └─────────────────┘  ┌──────────────┐       │
                      │ @adversyn/   │ eth_sendFrameTransaction
                      │ executor     │──────────▶  alt-mempool sidecar
                      └──────┬───────┘ ◀──────────  (admit / reject + reason text)
                             │ Observation (facts only)
                             ▼                 │
                      ┌──────────────┐◀────────┘
                      │ @adversyn/   │
                      │ analyzer     │  pass / finding / inconclusive
                      └──────┬───────┘
                             ▼
                      ┌──────────────┐
                      │ @adversyn/   │  results.json · findings.json · report.md
                      │ reporter     │
                      └──────────────┘
```

## Quick start

Requires Node 22+ and pnpm.

```bash
pnpm install
pnpm test                      # 130+ offline tests, no network needed
pnpm adversyn run              # run all example scenarios against the public devnet
```

Useful options:

```bash
pnpm adversyn run --only invalid-atomic-in-prefix,invalid-verify-after-prefix
pnpm adversyn run --rpc http://localhost:14337/rpc/ --chain-id 9     # a local sidecar (example from the workshop config, not tested here)
pnpm adversyn run --out out/my-run --fail-on-finding                 # exit 1 on any finding
```

`--delay <ms>` sets the pause between submissions (default 300). Reports are written to `out/<run-id>/`, or to `--out` if given (`results.json`, `findings.json`, `report.md`). When the node rejects a transaction, the report keeps its wording as `node said: ...`.

### Mutating scenarios

`adversyn mutate` generates controlled variants of existing scenarios, offline and deterministically. It sends nothing to a node. Generated scenarios are candidates for testing, not findings. See [`docs/mutation.md`](docs/mutation.md).

```bash
pnpm adversyn mutate --out out/mutants                                   # all seeds, all operators
pnpm adversyn mutate --only valid-self-verify --operators atomic-flag --out out/mutants-atomic
```

Operators: `gas-boundary`, `frame-order`, `frame-remove`, `frame-duplicate`, `role`, `atomic-flag`. Run a few, not all. A committed set lives in `scenarios/generated/`:

```bash
pnpm adversyn run scenarios/generated/scenarios --only valid-self-verify.atomic-flag.9172d677
```

Each case in the manifest carries the policy's prediction. A mismatch between prediction and what the node did is a lead to investigate, not a confirmed vulnerability.

### Funded runs

By default each scenario uses a fresh throwaway key with no balance. That is enough for the structural rules, but valid transactions then stop at the solvency check. To go further, fund a **fresh, dedicated** key and pass it in:

```bash
ADVERSYN_PRIVATE_KEY=0x... pnpm adversyn run --only valid-self-verify
```

An admission prints `admitted, tx hash 0x...`. Look it up at `https://explorer.altmempool.wtf/tx/<hash>?node=<url-encoded RPC URL>` (the exact links used are in [`docs/evidence/`](docs/evidence/README.md)). "Admitted" means the sidecar accepted the transaction into its pool; it is not proof of inclusion. Funded runs send real transactions to a shared devnet, so keep them few.

Never reuse a real key, and never commit one (`.env` is git-ignored).

## Scenarios

Scenarios are declarative YAML, validated by a schema, and carry their own expectation:

```yaml
id: invalid-verify-after-prefix
title: VERIFY frame in the execution body
exercises: [PREFIX-050]
frames:
  - role: self_verify
    mode: VERIFY
    target: sender
    limits: { execution: 30000 }
  - role: execution
    mode: VERIFY
    target: "0x8943545177806ED17B9F23F0a21ee5948eCaa776"
    limits: { execution: 5000 }
expect:
  verdict: reject
  ruleIds: [PREFIX-050]
```

`role` is an authoring label. It does not exist on the wire: the node infers roles from frame modes, scopes and positions, and Adversyn's policy does the same where it matters. A test checks that every example agrees with the policy, so a wrong `expect` fails in CI.

Scenarios the compiler cannot map yet (or that need contracts, stake, or an expiry verifier) are skipped with an explicit reason, not guessed at.

## Repository layout

```
packages/
  core/        shared schemas: Scenario, Observation, Finding, Report; canonical hashing; fingerprints
  protocol/    scenario → signed wire transaction (wraps @forshtat/hegota-support)
  policy/      versioned ERC-8421 rule evaluators and predict()
  scenarios/   YAML loader
  executor/    submit to a sidecar and record an Observation
  analyzer/    node reason text → rule attribution; compare prediction vs observation
  reporter/    JSON and Markdown reports
  cli/         `adversyn run`
  testkit/     fixtures, including real captured node rejections
scenarios/examples/   14 example scenarios
tests/                cross-package tests
apps/dashboard/       not started
```

## Known limitations

Please read these before trusting a result. The full list, with the open spec questions, is in [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md).

- **Structural rules only.** Opcode, storage, calling, creation, reputation and lifecycle rules (`OPCODES-*`, `STORAGE-*`, `CALLING-*`, `CREATION-010`, `REPUTATION-*`, `LIFECYCLE-*`, `LOCAL-*`) are *not evaluated*. Every prediction lists them as unevaluated.
- **ERC-8421 only.** EIP-8141's own constraints are not in the policy. A generated mutant found one: the node rejects an atomic flag on the last frame.
- **Unfunded keys stop at solvency.** A "pass" at the solvency stage means the structural rules held, nothing more.
- **The devnet changes.** On 2026-11-06 the maintainer removed the verification gas limits, so `BUDGET-010` no longer rejects there. Quote behaviour with dates.
- **Skipped or inconclusive scenarios (6 of 14):** two need a deployed contract (a paymaster, or a sender with code for `PREFIX-110`), two need the expiry verifier address for `PREFIX-080`, one needs stake in the registry, and one (`lead-deploy-not-deploying-sender`) exercises a clause the policy does not evaluate, so it is inconclusive.
- **Rule attribution is text-based.** The sidecar reports rejections as text. Adversyn matches known wording. The node reports a generic message for several prefix-shape rules, so `PREFIX-020` and `PREFIX-120` currently show up attributed to `PREFIX-010`.
- **Spec pin.** The policy is tagged `erc-8421@74a868cd`, the commit the alt-mempool workshop pins. That commit is not in the history of the `pr-clean` branch (checked 2026-11-06). The rules the policy encodes are unchanged across all five commits of that branch (latest `493ba8a`).
- **Draft specs.** EIP-8141 and ERC-8421 are drafts and devnets track different revisions. Expect rules and wording to change.
- **One observed constant.** The 2,800-gas signature cost is measured from a single node and is not in the spec.

## Responsible use

Adversyn submits real transactions to shared infrastructure. Use fresh throwaway keys, keep the default pacing between submissions, and do not run mass-invalidation or reputation-burning traffic against a shared devnet. If a run reveals the node admitting something the spec forbids, report it to the maintainers before publishing it.

## Roadmap

1. Funded runs: one admitted transaction, plus the simulation-dependent rules (`PREFIX-020`, `PREFIX-120`, `PREFIX-110`).
2. Unlock the remaining scenarios: expiry verifier, deployed paymaster/wallet, staking.
3. Trace-based rules via the sidecar's simulation method, if exposed.
4. Differential testing: canonical mempool vs alternative mempool.
5. Minimizer and `adversyn replay` for reproducible bundles.
6. Dashboard.

## Built with

- [`@forshtat/hegota-support`](https://github.com/forshtat/hegota-support) for frame construction, signing and the wire format.
- The alt-mempool sidecar and devnet from the ERC-8421 workshop, and the ERC-8421 and EIP-8141 drafts.
- TypeScript, pnpm workspaces, zod, viem, vitest.

## Definitions
PREFIX-040: no prefix frame may carry the atomic batch flag. That flag groups frames to run together, and the rule forbids it during validation. Adversyn set it on a prefix frame, and the node said “frame 0 in validation prefix has ATOMIC_BATCH_FLAG set”.

PREFIX-050: no VERIFY frame may come after the prefix. Validation frames are only allowed at the start. Adversyn put one later in the transaction, and the node said “frame 2 is a VERIFY frame after the validation prefix”.

BUDGET-010: a limit on how much gas validation can use. An entity that hasn’t staked is allowed 100,000 gas for validation, and one that has staked is allowed 1,000,000. Checking the transaction’s signature also counts toward the sender’s share, and the spec says so without giving a number.



## License

MIT