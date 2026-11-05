import type { PolicyRef, Scenario } from "@adversyn/core";
import type { PrefixInfo } from "./prefix.js";

export interface EvalContext {
  nowSec: number;
  sigVerifyCost?: number;
}

export interface RuleOutcome {
  ruleId: string;
  status: "pass" | "fail" | "not-applicable";
  detail?: string;
}

export interface Rule {
  id: string;
  summary: string;
  evaluate(s: Scenario, p: PrefixInfo, ctx: EvalContext): RuleOutcome;
}

export interface Prediction {
  policy: PolicyRef;
  verdict: "accept" | "reject";
  violated: string[];
  results: RuleOutcome[];
  unevaluated: string[];
}
