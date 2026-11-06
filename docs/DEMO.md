# Adversyn: 3-minute demo script

Goal: show a tool that tells the truth about a real alt-mempool node, including what it cannot conclude and what changed under it.

## Before you record (5 minutes)

- [ ] `pnpm install && pnpm test` is green and `git status` is clean.
- [ ] Run the live set once and keep it as your fallback: `pnpm adversyn run --only invalid-lone-only-verify,invalid-deploy-not-first,invalid-atomic-in-prefix,invalid-verify-after-prefix --out out/demo-backup`
- [ ] Browser tabs open: the explorer pages for both admitted transactions (links in `docs/evidence/README.md`), and `docs/evidence/budget-drift/README.md`.
- [ ] Terminal font is large, window is wide, `clear` before each section.
- [ ] Check that the README's statement about how AI was used matches what you actually did.
- [ ] Before using the last mutant in the live section, try it once yourself (see 1:50). If the result differs from the saved report, use the saved report.

## Script

### 0:00 - 0:25 · The problem

> "EIP-8141 lets a transaction carry validation logic. Alternative mempools like ERC-8421's decide which of those transactions to admit, using rules plus stake and reputation. If a node drifts from the spec, you get valid transactions rejected or attacks admitted. Adversyn is a testing layer that checks a real node against the spec. It is not another mempool. It is the thing that attacks one."

Show: the README's pipeline diagram.

### 0:25 - 1:10 · Live against the real devnet

```bash
pnpm adversyn run --only invalid-lone-only-verify,invalid-deploy-not-first,invalid-atomic-in-prefix,invalid-verify-after-prefix
```

> "Each scenario is a frame transaction crafted to break one rule. Adversyn predicts the verdict from the ERC-8421 rules, sends it to the public sidecar, and compares. Look at the lines under each result: that is the node's own wording, saved with the result."

Point at `invalid-atomic-in-prefix`: the node said `frame 0 in validation prefix has ATOMIC_BATCH_FLAG set`, which is `PREFIX-040`, and the verdict matches the prediction.

### 1:10 - 1:50 · It was admitted

Open the explorer tab for `0x430ef707…3854`.

> "A valid transaction from Adversyn, admitted by the sidecar. The admission report shows every rule passed. Admitted means accepted into the pool. This one was still waiting to be mined when I captured it."

Open the tab for `0xfcbd6c9f…533f`.

> "This one is on chain. It has a first frame that deploys nothing. The spec says a deploy frame must deploy the sender, and my static policy does not check that clause, so I cannot call this a bug. It is an open question for the maintainers, and it is written down as one."

### 1:50 - 2:30 · Mutation

```bash
pnpm adversyn mutate --only valid-self-verify --operators atomic-flag --out out/demo-mutants
```

> "Mutation is offline. It generates controlled variants of a scenario, deterministically, each with the policy's prediction and its provenance. Nothing is sent yet."

Then run one committed mutant:

```bash
pnpm adversyn run scenarios/generated/scenarios --only valid-self-verify.atomic-flag.9172d677
```

> "Prediction matched the node."

Then show the second mutant from the saved report, `docs/evidence/mutants/mutant-run-3/report.md`: the policy predicted accept, the node rejected it with "Frame 1: atomic batch flag on last frame".

> "My policy was wrong here. That rule comes from EIP-8141, not ERC-8421, and my policy only encodes ERC-8421. The tool found a gap in its own predictions, so I documented it as a follow-up."

(That mutant has been run with a funded key. Running it live with a throwaway key has not been tried, so use the saved report unless you have tested it.)

### 2:30 - 2:50 · A measurement that stopped reproducing

Show `docs/evidence/budget-drift/README.md`.

> "This morning the node rejected 97,201 gas for BUDGET-010, and I measured the real boundary at 97,200 with the node's own signature cost. Later the devnet maintainer restarted the devnet without gas limits, and the same scenarios are now accepted. I did not report a vulnerability. I saved before and after runs and wrote down the cause. Adversyn dates its claims for exactly this reason."

### 2:50 - 3:00 · What's next

> "Next: the EIP-8141 constraints in the policy, a funded run for the simulation-dependent rules, deployed paymasters and stake, and a minimizer for reproducible findings. The open spec questions are in docs/LIMITATIONS.md."

## If something goes wrong

| Problem | What to do |
|---|---|
| Devnet unreachable (`RPC_UNREACHABLE` errors) | Say so, then `cat out/demo-backup/report.md` and narrate from the saved run, saying when it was captured. |
| A new `FINDING` appears live | Do not claim a node bug. Say: "that's a candidate. I check it against the spec text before believing it", then read the report entry. |
| The devnet was restarted and behaviour changed | Say that is the point of the budget-drift story, and show the saved runs. |
| Run is slow | Use `--only` with two scenarios. |

## Do not claim

- That Adversyn found a node bug or a vulnerability. It did not.
- That an admission is the same as a mined transaction. Only `0xfcbd6c9f…533f` was seen on chain.
- That a PASS at the solvency stage means the whole transaction is valid.
- That rules outside the structural set (opcodes, storage, reputation) are tested.
- That the 97,200 boundary is current. It was true that morning and no longer reproduces.
