import type { PolicyRef, Scenario } from "@adversyn/core";
import { analyzePrefix } from "./prefix.js";
import { RULES, UNEVALUATED } from "./rules.js";
import type { EvalContext, Prediction } from "./types.js";

export const PACKAGE = "@adversyn/policy";
export * from "./types.js";
export * from "./prefix.js";
export { RULES, UNEVALUATED, MAX_VERIFY_GAS_PER_ENTITY, MAX_VERIFY_GAS_STAKED_ENTITY } from "./rules.js";

export const ERC8421_STATIC_POLICY: PolicyRef = {
  id: "erc-8421-static",
  pins: [{ spec: "erc-8421", commit: "74a868cd" }],
};

export function predict(
  s: Scenario,
  ctx: EvalContext = { nowSec: Math.floor(Date.now() / 1000) },
): Prediction {
  const prefix = analyzePrefix(s);
  const results = RULES.map((r) => r.evaluate(s, prefix, ctx));
  const violated = results.filter((r) => r.status === "fail").map((r) => r.ruleId);
  return {
    policy: ERC8421_STATIC_POLICY,
    verdict: violated.length > 0 ? "reject" : "accept",
    violated,
    results,
    unevaluated: UNEVALUATED,
  };
}
