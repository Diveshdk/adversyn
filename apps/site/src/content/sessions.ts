// Terminal sessions shown on the site.
//
// Offline commands (help, mutate, error cases) are verbatim CLI output captured from this repository.
// Commands that reach the devnet are reconstructed line-for-line from recorded run files in
// docs/evidence/, using the exact format printed by packages/cli/src/index.ts. Absolute paths are
// shortened to ~/adversyn. Each use on the site carries a caption naming its source and date.

import { DEVNET_RPC, TX_A } from "./facts";

export const HELP = `$ pnpm adversyn --help
Usage: adversyn [options] [command]

Adversarial testing for EIP-8141 frame transactions and alt mempools

Options:
  -h, --help              display help for command

Commands:
  run [options] [dir]
  mutate [options] [dir]  Generate deterministic mutated scenarios from seed
                          scenarios (offline; nothing is sent to a node)
  help [command]          display help for command`;

export const RUN_HELP = `$ pnpm adversyn run --help
Usage: adversyn run [options] [dir]

Arguments:
  dir                scenario directory (default: "scenarios/examples")

Options:
  --rpc <url>        sidecar RPC URL (default:
                     "https://altmempoolgateway.forshtat.com/rpc")
  --chain-id <n>     chain id (default: "1337")
  --profile <name>   hegota-support profile (default: "ethrex-eip8141-tracer")
  --only <ids>       comma-separated scenario ids
  --delay <ms>       pause between submissions (default: "300")
  --out <dir>        report output directory
  --fail-on-finding  exit 1 if any finding is produced
  -h, --help         display help for command`;

export const MUTATE_HELP = `$ pnpm adversyn mutate --help
Usage: adversyn mutate [options] [dir]

Generate deterministic mutated scenarios from seed scenarios (offline; nothing
is sent to a node)

Arguments:
  dir                seed scenario directory (default: "scenarios/examples")

Options:
  --only <ids>       comma-separated seed scenario ids
  --operators <ids>  comma-separated operator ids (default: all)
  --max <n>          maximum number of generated scenarios
  --now <unixSec>    time for time-dependent policy rules (default: current
                     time, recorded in the manifest)
  --out <dir>        output directory (default: "out/mutants")
  --overwrite        overwrite files from a previous run in --out
  -h, --help         display help for command`;

export const MUTATE_ATOMIC = `$ pnpm adversyn mutate --only valid-self-verify --operators atomic-flag --now 1800000000
1 seed scenario(s), operators: atomic-flag, now=1800000000
generated 2, skipped 0, truncated 0
  atomic-flag: 2
These are offline policy predictions, not observations. Nothing was sent to a node.
wrote: ~/adversyn/out/mutants/manifest.json
run them with: pnpm adversyn run ~/adversyn/out/mutants/scenarios`;

export const MUTATE_ALL = `$ pnpm adversyn mutate --now 1800000000 --out out/mutants-all
14 seed scenario(s), operators: gas-boundary, frame-order, frame-remove, frame-duplicate, role, atomic-flag, now=1800000000
generated 131, skipped 95, truncated 0
  gas-boundary: 26
  frame-order: 9
  frame-remove: 12
  frame-duplicate: 21
  role: 45
  atomic-flag: 18
skipped (first 15):
  valid-self-verify / gas-boundary / frames[1].limits.execution: role execution is not counted toward verification gas by the policy
  valid-self-verify / role / frames[0].role: target role expiry_verify cannot be compiled yet
  valid-self-verify / role / frames[0].role: label-only for VERIFY frames (deploy, pre_verify, execution): the compiled transaction is identical, so a node cannot tell these apart and the policy's prediction would not be testable
  valid-self-verify / role / frames[1].role: target role expiry_verify cannot be compiled yet
# (11 further skip lines omitted here)
  ... 80 more in the manifest
These are offline policy predictions, not observations. Nothing was sent to a node.
wrote: ~/adversyn/out/mutants-all/manifest.json
run them with: pnpm adversyn run ~/adversyn/out/mutants-all/scenarios`;

/** Structural subset, unfunded. Node wording as recorded on the public devnet, 2026-11-06. */
export const RUN_STRUCTURAL = `$ pnpm adversyn run --only valid-self-verify,invalid-atomic-in-prefix,invalid-verify-after-prefix
target ${DEVNET_RPC} (chain 1337), 3 scenarios
sender: fresh throwaway key per scenario
PASS         valid-self-verify  [solvency]
             node stopped at the solvency check, so static rules passed; later rules (opcodes, storage, ...) were not exercised
PASS         invalid-atomic-in-prefix  [static]
             node said: frame 0 in validation prefix has ATOMIC_BATCH_FLAG set
PASS         invalid-verify-after-prefix  [static]
             node said: frame 1 is a VERIFY frame after the validation prefix (ends at index 0)

3 scenarios: 3 pass, 0 findings, 0 inconclusive/skipped, 0 errors
wrote:
  ~/adversyn/out/run-<timestamp>/results.json
  ~/adversyn/out/run-<timestamp>/findings.json
  ~/adversyn/out/run-<timestamp>/report.md`;

/** docs/evidence/valid-self-verify — funded key, admitted. */
export const RUN_BASELINE_FUNDED = `# a funded, throwaway devnet key is exported as ADVERSYN_PRIVATE_KEY
$ pnpm adversyn run --only valid-self-verify --out out/evidence-valid
target ${DEVNET_RPC} (chain 1337), 1 scenarios
sender: funded key from ADVERSYN_PRIVATE_KEY
PASS         valid-self-verify  [admitted]
             admitted, tx hash ${TX_A}

1 scenarios: 1 pass, 0 findings, 0 inconclusive/skipped, 0 errors
wrote:
  ~/adversyn/out/evidence-valid/results.json
  ~/adversyn/out/evidence-valid/findings.json
  ~/adversyn/out/evidence-valid/report.md`;

/** docs/evidence/mutants/mutant-run-2c — verdict, stage and wording recorded 2026-11-06 15:34 UTC. */
export const RUN_MUTANT_PREFIX = `$ pnpm adversyn run scenarios/generated/scenarios --only valid-self-verify.atomic-flag.9172d677
target ${DEVNET_RPC} (chain 1337), 1 scenarios
sender: fresh throwaway key per scenario
PASS         valid-self-verify.atomic-flag.9172d677  [static]
             node said: frame 0 in validation prefix has ATOMIC_BATCH_FLAG set

1 scenarios: 1 pass, 0 findings, 0 inconclusive/skipped, 0 errors
wrote:
  ~/adversyn/out/run-<timestamp>/results.json
  ~/adversyn/out/run-<timestamp>/findings.json
  ~/adversyn/out/run-<timestamp>/report.md`;

/** docs/evidence/mutants/mutant-run-3 — funded key, 2026-11-06 15:36 UTC. */
export const RUN_MUTANT_LAST = `$ pnpm adversyn run scenarios/generated/scenarios --only valid-self-verify.atomic-flag.8f8946c4
target ${DEVNET_RPC} (chain 1337), 1 scenarios
sender: funded key from ADVERSYN_PRIVATE_KEY
FINDING      valid-self-verify.atomic-flag.8f8946c4  [other]
             Node rejected a transaction for an unrecognised reason

1 scenarios: 0 pass, 1 findings, 0 inconclusive/skipped, 0 errors
wrote:
  ~/adversyn/out/run-<timestamp>/results.json
  ~/adversyn/out/run-<timestamp>/findings.json
  ~/adversyn/out/run-<timestamp>/report.md`;

/** docs/evidence/budget-drift/fifth — the full example set, unfunded, 2026-11-06 03:58 UTC. */
export const RUN_ALL_HISTORICAL = `$ pnpm adversyn run
target ${DEVNET_RPC} (chain 1337), 14 scenarios
sender: fresh throwaway key per scenario
PASS         valid-self-verify  [solvency]
             node stopped at the solvency check, so static rules passed; later rules (opcodes, storage, ...) were not exercised
INCONCLUSIVE valid-only-verify-pay  [skipped]
             skipped: needs a deployed contract (paymaster, wallet, ...) that Adversyn does not deploy yet
INCONCLUSIVE valid-pre-verify  [skipped]
             skipped: needs a deployed contract (paymaster, wallet, ...) that Adversyn does not deploy yet
PASS         invalid-lone-only-verify  [static]
PASS         invalid-deploy-not-first  [static]
PASS         invalid-atomic-in-prefix  [static]
PASS         invalid-verify-after-prefix  [static]
INCONCLUSIVE invalid-expired-expiry  [skipped]
             skipped: frame 0: role expiry_verify needs verifier/factory details not mapped yet
INCONCLUSIVE valid-future-expiry  [skipped]
             skipped: frame 0: role expiry_verify needs verifier/factory details not mapped yet
INCONCLUSIVE invalid-stray-default-frame  [solvency]
             node stopped at the solvency check; PREFIX-010, PREFIX-120 depends on simulation or frame classification and may not have been evaluated yet. Re-run with a funded key (ADVERSYN_PRIVATE_KEY).
PASS         invalid-budget-unstaked  [static]
INCONCLUSIVE valid-budget-staked  [skipped]
             skipped: needs staked entities; staking is not arranged by Adversyn
PASS         boundary-budget-97200  [solvency]
             node stopped at the solvency check, so static rules passed; later rules (opcodes, storage, ...) were not exercised
PASS         boundary-budget-97201  [static]

14 scenarios: 8 pass, 0 findings, 6 inconclusive/skipped, 0 errors`;

/** Captured offline: nothing listening on the port. */
export const RUN_UNREACHABLE = `$ pnpm adversyn run --rpc http://127.0.0.1:59999/rpc --only invalid-atomic-in-prefix,valid-budget-staked,invalid-expired-expiry
target http://127.0.0.1:59999/rpc (chain 1337), 3 scenarios
sender: fresh throwaway key per scenario
ERROR        invalid-atomic-in-prefix  [error]
             submission failed before a verdict: Cannot reach http://127.0.0.1:59999/rpc: fetch failed
INCONCLUSIVE invalid-expired-expiry  [skipped]
             skipped: frame 0: role expiry_verify needs verifier/factory details not mapped yet
INCONCLUSIVE valid-budget-staked  [skipped]
             skipped: needs staked entities; staking is not arranged by Adversyn

3 scenarios: 0 pass, 0 findings, 2 inconclusive/skipped, 1 errors`;

export const INVALID_SCENARIO = `$ pnpm adversyn run ./my-scenarios
~/adversyn/packages/scenarios/src/index.ts:24
    throw new Error(\`\${file}: \${e instanceof Error ? e.message : String(e)}\`);
          ^

Error: ~/adversyn/my-scenarios/bad.yaml: [
  {
    "origin": "string",
    "code": "invalid_format",
    "format": "regex",
    "pattern": "/^[a-z0-9][a-z0-9._-]*$/",
    "path": [
      "id"
    ],
    "message": "use lowercase, digits, . _ -"
  },
# (further schema issues follow, e.g. frames: too_small, minimum 1)`;

export const MUTATE_UNKNOWN_SEED = `$ pnpm adversyn mutate --only nope
error: unknown seed scenario id(s): nope`;

export const MUTATE_BAD_MAX = `$ pnpm adversyn mutate --max -1
error: --max must be a non-negative integer`;

export const MUTATE_EXISTS = `$ pnpm adversyn mutate --only valid-self-verify --operators atomic-flag --now 1800000000
error: ~/adversyn/out/mutants/manifest.json already exists; choose a new --out directory or pass --overwrite`;

export const INSTALL = `$ git clone https://github.com/Diveshdk/adversyn.git
$ cd adversyn
$ pnpm install`;

export const TEST = `$ pnpm test

 Test Files  17 passed (17)
      Tests  131 passed (131)`;

export const VERSIONS = `$ node --version
v24.7.0
$ pnpm --version
10.20.0`;
