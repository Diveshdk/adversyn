export type PatternKind = string | "SOLVENCY-STAGE" | "VALIDATION-STAGE";

export interface ReasonPattern {
  ruleId: PatternKind;
  pattern: RegExp;
  observedExample: string;
  observedAt: string;
}

export const REASON_PATTERNS: ReasonPattern[] = [
  {
    ruleId: "PREFIX-010",
    pattern: /frame transaction validation prefix not recognized/i,
    observedExample: "frame transaction validation prefix not recognized",
    observedAt: "public devnet, 2026-11-06 (generic shape rejection; may also cover other prefix-shape rules)",
  },
  {
    ruleId: "PREFIX-040",
    pattern: /in validation prefix has ATOMIC_BATCH_FLAG set/i,
    observedExample: "frame 0 in validation prefix has ATOMIC_BATCH_FLAG set",
    observedAt: "public devnet, 2026-11-06",
  },
  {
    ruleId: "PREFIX-050",
    pattern: /is a VERIFY frame after the validation prefix/i,
    observedExample: "frame 2 is a VERIFY frame after the validation prefix (ends at index 0)",
    observedAt: "public devnet, 2026-11-06",
  },
  {
    ruleId: "BUDGET-010",
    pattern: /validation prefix execution gas sum .* exceeds MAX_VERIFY_GAS/i,
    observedExample:
      "validation prefix execution gas sum 100001 + signature-verification cost 2800 = 102801 exceeds MAX_VERIFY_GAS 100000",
    observedAt: "public devnet, 2026-11-06",
  },
  {
    ruleId: "SOLVENCY-STAGE",
    pattern: /the payer 0x[0-9a-f]{40} has \d+ wei, the transaction's maximum cost is \d+ wei/i,
    observedExample:
      "validation frame 0: the payer 0x94b8... has 0 wei, the transaction's maximum cost is 605652000000000 wei",
    observedAt: "public devnet, 2026-11-06",
  },
  {
    ruleId: "VALIDATION-STAGE",
    pattern: /validation frame \d+: the frame's default code reported failure/i,
    observedExample: "validation frame 1: the frame's default code reported failure",
    observedAt: "public devnet, 2026-11-06",
  },
];
