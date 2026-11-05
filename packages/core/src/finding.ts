import { z } from "zod";
import { SCHEMA_VERSION, Verdict } from "./primitives.js";
import { PolicyRef, policyRefString } from "./policy.js";
import { hashCanonical } from "./canonical.js";

export const FindingClass = z.enum([
  "conformance",
  "differential",
  "consistency",
  "no-oracle",
]);
export type FindingClass = z.infer<typeof FindingClass>;

export const FindingStatus = z.enum(["violation", "anomaly"]);
export const Severity = z.enum(["info", "low", "medium", "high"]);

export const VerdictWithRules = z.object({
  verdict: Verdict,
  ruleIds: z.array(z.string()).default([]),
});
export type VerdictWithRules = z.infer<typeof VerdictWithRules>;

export const Finding = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
  fingerprint: z.string().min(1),
  class: FindingClass,
  status: FindingStatus,
  severity: Severity,
  title: z.string().min(1),
  policy: PolicyRef,
  scenarioId: z.string().min(1),
  scenarioHash: z.string().min(1),
  runId: z.string().min(1),
  expected: VerdictWithRules,
  observed: VerdictWithRules,
  evidence: z.object({
    notes: z.array(z.string()).default([]),
    observation: z.unknown().optional(),
  }),
  detectedAt: z.string(),
});
export type Finding = z.infer<typeof Finding>;

export interface FingerprintInput {
  class: FindingClass;
  policy: PolicyRef;
  scenarioHash: string;
  expected: VerdictWithRules;
  observed: VerdictWithRules;
}

export function makeFingerprint(input: FingerprintInput): string {
  const norm = (v: VerdictWithRules) => ({
    verdict: v.verdict,
    ruleIds: [...v.ruleIds].sort(),
  });
  return hashCanonical({
    class: input.class,
    policy: policyRefString(input.policy),
    scenarioHash: input.scenarioHash,
    expected: norm(input.expected),
    observed: norm(input.observed),
  });
}
