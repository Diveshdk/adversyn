import type { Frame, Scenario } from "@adversyn/core";

export interface OperatorContext {
  /** Policy version string recorded in provenance, e.g. "erc-8421-static:erc-8421@74a868cd". */
  policy: string;
}

/** A proposed change. Operators build these; buildMutant turns them into scenarios. */
export interface Candidate {
  /** Path of the changed field, e.g. "frames[0].limits.execution". */
  field: string;
  original: unknown;
  mutated: unknown;
  /** The complete new frame list (a fresh copy, never the parent's array). */
  frames: Frame[];
}

export interface Skip {
  operator: string;
  field?: string;
  reason: string;
}

export interface OperatorResult {
  candidates: Candidate[];
  skipped: Skip[];
}

export interface MutationOperator {
  /** kebab-case, used in generated IDs, so only lowercase letters, digits and "-". */
  id: string;
  description: string;
  generate(seed: Scenario, ctx: OperatorContext): OperatorResult;
}
