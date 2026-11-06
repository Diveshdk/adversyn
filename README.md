# Adversyn

**Adversarial conformance testing for EIP-8141 Frame Transactions and alternative mempools.**

Adversyn sends crafted Frame Transactions to a real alt-mempool sidecar, records exactly what the node says, and compares that against a versioned policy derived from ERC-8421. Where the node and the spec disagree, Adversyn produces a structured finding. Where it cannot tell, it says so.

```
Generate → Execute → Observe → Analyze → Reproduce → Mitigate → Retest
```

Adversyn is **not** a mempool, an explorer, an EVM, a generic contract auditor, or a replacement for the alt-mempool sidecar. It is the testing and analysis layer around that infrastructure.

> **Status: early.** Built at ETHGlobal Mumbai. The generate → execute → observe → analyze → report loop works end to end against the public alt-mempool devnet. Minimization, differential testing and trace-based rules are not built yet (see [Roadmap](#roadmap)).

## What it found so far

Against the public devnet sidecar (`altmempoolgateway.forshtat.com`, chain 1337), using throwaway unfunded keys:

| Rule (ERC-8421) | Confirmed enforced by the node | Node's wording (captured) |
|---|---|---|
| `PREFIX-010` prefix shape | yes | `frame transaction validation prefix not recognized` |
| `PREFIX-040` no atomic flag in prefix | yes | `frame 0 in validation prefix has ATOMIC_BATCH_FLAG set` |
| `PREFIX-050` no VERIFY after prefix | yes | `frame 2 is a VERIFY frame after the validation prefix (ends at index 0)` |
| `BUDGET-010` verification gas budget | yes | `validation prefix execution gas sum 100001 + signature-verification cost 2800 = 102801 exceeds MAX_VERIFY_GAS 100000` |

### A measured calibration

ERC-8421 says the intrinsic cost of validating the transaction's signatures counts toward the sender's 100,000 gas budget, but does not give a number. The sidecar reports **2,800** for a secp256k1 signature. Adversyn encodes that as an *observed* parameter (not a spec constant) and pins it with two boundary scenarios:

| Sender verification gas | + signature cost | Result |
|---|---|---|
| 97,200 | = 100,000 | passes the structural checks |
| 97,201 | = 100,001 | rejected for `BUDGET-010` |

So the effective limit for an unstaked sender is **97,200**, not 100,000.

### Latest run

```
14 scenarios: 8 pass, 0 findings, 6 inconclusive/skipped, 0 errors
```

See [`docs/sample-report.md`](docs/sample-report.md) for the full table, or run it yourself below.

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
pnpm test                      # 60+ offline tests, no network needed
pnpm adversyn run              # run all example scenarios against the public devnet
```

Useful options:

```bash
pnpm adversyn run --only boundary-budget-97200,boundary-budget-97201
pnpm adversyn run --rpc http://localhost:14337/rpc/ --chain-id 9     # a local sidecar
pnpm adversyn run --out out/my-run --fail-on-finding                 # exit 1 on any finding
```

Reports are written to `out/<run-id>/` (`results.json`, `findings.json`, `report.md`).

### Funded runs

By default each scenario uses a fresh throwaway key with no balance. That is enough for the structural rules, but valid transactions then stop at the solvency check. To go further, fund a **fresh, dedicated** key and pass it in:

```bash
ADVERSYN_PRIVATE_KEY=0x... pnpm adversyn run --only valid-self-verify
```

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

Please read these before trusting a result.

- **Structural rules only.** Opcode, storage, calling, creation, reputation and lifecycle rules (`OPCODES-*`, `STORAGE-*`, `CALLING-*`, `CREATION-010`, `REPUTATION-*`, `LIFECYCLE-*`, `LOCAL-*`) are *not evaluated*. Every prediction lists them as unevaluated.
- **Unfunded keys stop at solvency.** A "pass" at the solvency stage means the structural rules held, nothing more.
- **Skipped scenarios (6 of 14):** two need a deployed contract (a paymaster, or a sender with code for `PREFIX-110`), two need the expiry verifier address for `PREFIX-080`, one needs stake in the registry, and one (`invalid-stray-default-frame`) is masked by the solvency stage and needs a funded run.
- **Rule attribution is text-based.** The sidecar reports rejections as text. Adversyn matches known wording. The node reports a generic message for several prefix-shape rules, so `PREFIX-020` and `PREFIX-120` currently show up attributed to `PREFIX-010`.
- **Spec pin.** The policy is tagged `erc-8421@74a868cd`, the commit the alt-mempool workshop pins. The rule text used to write it was read from the `pr-clean` branch of the ERC draft; whether that is identical to the pinned commit has not been verified.
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