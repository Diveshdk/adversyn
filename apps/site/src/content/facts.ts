// Single source of truth for facts the site states about Adversyn.
// Every value here is taken from the repository (CLI source, policy, analyzer, docs/evidence).

export const REPO_URL = "https://github.com/Diveshdk/adversyn";
export const repoFile = (p: string) => `${REPO_URL}/blob/main/${p}`;
export const repoTree = (p: string) => `${REPO_URL}/tree/main/${p}`;

export const DEVNET_RPC = "https://altmempoolgateway.forshtat.com/rpc";
export const DEVNET_CHAIN_ID = 1337;
export const EXPLORER_URL = "https://explorer.altmempool.wtf/";
export const explorerTx = (hash: string) =>
  `https://explorer.altmempool.wtf/tx/${hash}?node=https%3A%2F%2Faltmempoolgateway.forshtat.com%2Frpc`;

export const HEGOTA_SUPPORT_URL = "https://github.com/forshtat/hegota-support";

export const POLICY_REF = "erc-8421-static:erc-8421@74a868cd";
export const SPEC_PIN = "erc-8421@74a868cd";
export const DEFAULT_PROFILE = "ethrex-eip8141-tracer";
export const SIG_COST_OBSERVED = 2800;
export const TEST_COUNT = 131;
export const TEST_FILES = 17;

export const TX_A = "0x430ef7075e47898eb79f6581ef84a586da9a88ffd1c5fd1585dee49e78b73854";
export const TX_B = "0xfcbd6c9fd229b589d14a09e871aa73f3a2ecafb226630b2a00da005d6fe3533f";
export const TX_GAS_MUTANT = "0x39d39f8c4ee70ae174aa47630f7726c4c67a9540ac25df97416fea29408b8a9e";

export const short = (h: string) => `${h.slice(0, 10)}…${h.slice(-4)}`;

export interface RuleInfo {
  id: string;
  summary: string;
  stage: "static" | "simulation" | "time";
  nodeText?: string;
}

/** The seven rules evaluated by packages/policy/src/rules.ts. */
export const RULES: RuleInfo[] = [
  {
    id: "PREFIX-010",
    summary: "Validation prefix must match one of the allowed shapes",
    stage: "static",
    nodeText: "frame transaction validation prefix not recognized",
  },
  { id: "PREFIX-020", summary: "A deploy frame must be first (after an optional expiry_verify) and unique", stage: "simulation" },
  {
    id: "PREFIX-040",
    summary: "No prefix frame may carry the atomic batch flag",
    stage: "static",
    nodeText: "frame 0 in validation prefix has ATOMIC_BATCH_FLAG set",
  },
  {
    id: "PREFIX-050",
    summary: "No VERIFY frame may follow the validation prefix",
    stage: "static",
    nodeText: "frame 2 is a VERIFY frame after the validation prefix (ends at index 0)",
  },
  { id: "PREFIX-080", summary: "An expiry_verify deadline earlier than the current block time is rejected", stage: "time" },
  { id: "PREFIX-120", summary: "A DEFAULT-mode prefix frame must be the deploy frame or a pre_verify frame", stage: "simulation" },
  {
    id: "BUDGET-010",
    summary: "Per-entity verification gas: 100,000 unstaked, 1,000,000 staked",
    stage: "static",
    nodeText:
      "validation prefix execution gas sum 100001 + signature-verification cost 2800 = 102801 exceeds MAX_VERIFY_GAS 100000",
  },
];

/** UNEVALUATED in packages/policy/src/rules.ts — listed on every prediction. */
export const UNEVALUATED = [
  "SIGNATURE-010",
  "PREFIX-020 (clause: the deploy frame must deploy tx.sender)",
  "PREFIX-060",
  "PREFIX-100",
  "PREFIX-110",
  "OPCODES-*",
  "CREATION-010",
  "CALLING-*",
  "STORAGE-*",
  "SOLVENCY-*",
  "REPUTATION-*",
  "LIFECYCLE-*",
  "LOCAL-*",
];

export const ALLOWED_SHAPES = ["self_verify", "deploy,self_verify", "only_verify,pay", "deploy,only_verify,pay"];

export interface OperatorInfo {
  id: string;
  changes: string;
  why: string;
  probes: string;
  skips: string;
}

/** Registry order from packages/mutation/src/registry.ts. */
export const OPERATORS: OperatorInfo[] = [
  {
    id: "gas-boundary",
    changes: "Sets limits.execution on each frame the policy counts toward verification gas to the last value the policy accepts and the first it rejects for BUDGET-010.",
    why: "Resource limits are where implementations most often disagree: off-by-one checks, missing signature costs, staked vs unstaked caps.",
    probes: "Whether the node enforces the per-entity verification gas cap at exactly the boundary the policy computes.",
    skips: "Frames the policy does not count; frames already over budget because of another entity; frames with no violation up to the 10,000,000 search ceiling.",
  },
  {
    id: "frame-order",
    changes: "Swaps each pair of adjacent frames.",
    why: "Prefix shape, deploy position and VERIFY placement are all order-dependent rules.",
    probes: "Prefix recognition (PREFIX-010), deploy-first (PREFIX-020) and VERIFY-after-prefix (PREFIX-050).",
    skips: "Single-frame seeds and swaps involving expiry_verify. Swapping identical frames is a no-op.",
  },
  {
    id: "frame-remove",
    changes: "Removes one frame at a time.",
    why: "Missing approvals or payers must be caught before a transaction is admitted.",
    probes: "Whether a prefix without its approver or payer is still recognised.",
    skips: "Single-frame seeds (the schema needs at least one frame).",
  },
  {
    id: "frame-duplicate",
    changes: "Inserts a copy of one frame immediately after itself.",
    why: "Duplicated deploy or VERIFY frames test uniqueness and placement rules without inventing new content.",
    probes: "Deploy uniqueness, VERIFY-after-prefix, and the 64-frame limit.",
    skips: "expiry_verify frames; duplicates exceeding 64 frames are rejected by the schema.",
  },
  {
    id: "role",
    changes: "Changes a frame's role, but only where that changes the compiled transaction (the approve scope of a VERIFY frame).",
    why: "Approve scopes decide who pays and who authorises execution.",
    probes: "Prefix shape recognition when approve scopes change (self_verify ↔ only_verify ↔ pay).",
    skips: "Label-only changes that leave the wire bytes identical, e.g. self_verify → deploy, or any role change on a SENDER frame.",
  },
  {
    id: "atomic-flag",
    changes: "Toggles the atomic batch flag on one frame at a time.",
    why: "The flag is a real wire change and is constrained by both ERC-8421 and EIP-8141.",
    probes: "PREFIX-040 on prefix frames; on body frames the policy predicts accept, so any rejection is an unattributed lead.",
    skips: "Nothing beyond schema validation.",
  },
];

export const STAGES = [
  { id: "static", meaning: "The node rejected on a structural rule before checking balance or simulating (PREFIX-010, PREFIX-040, PREFIX-050, BUDGET-010)." },
  { id: "solvency", meaning: "The node stopped at the payer-balance check. Static rules held; later stages were not reached. Typical for unfunded throwaway keys." },
  { id: "validation", meaning: "The node ran the frame's validation code and it reported failure. The policy has no oracle for this, so the result is inconclusive." },
  { id: "admitted", meaning: "The node accepted the transaction into its pool and returned a hash. Admitted is not the same as mined." },
  { id: "other", meaning: "The node rejected with wording that matches no known pattern in reasons.ts. Never attributed to a rule by guesswork." },
  { id: "error", meaning: "Transport or RPC failure (e.g. RPC_UNREACHABLE). No verdict was obtained." },
  { id: "skipped", meaning: "The executor did not submit: the scenario needs stake, a deployed contract, or a feature the compiler cannot map yet." },
];
