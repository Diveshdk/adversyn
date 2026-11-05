import type { Observation, Verdict } from "@adversyn/core";
import { REASON_PATTERNS } from "./reasons.js";

export type Stage = "admitted" | "static" | "solvency" | "other" | "error";

export interface ObservedVerdict {
  verdict: Verdict;
  ruleIds: string[];
  stage: Stage;
  texts: string[];
}

export function classifyObservation(obs: Observation): ObservedVerdict {
  const s = obs.submit;
  const texts = [s.errorMessage, ...s.reasons.map((r) => r.text)].filter(
    (t): t is string => typeof t === "string" && t.length > 0,
  );
  if (s.outcome === "admitted") return { verdict: "accept", ruleIds: [], stage: "admitted", texts };
  if (s.outcome === "error") return { verdict: "unknown", ruleIds: [], stage: "error", texts };

  const ids = new Set<string>();
  let solvency = false;
  for (const r of s.reasons) if (r.ruleId) ids.add(r.ruleId);
  for (const t of texts) {
    for (const p of REASON_PATTERNS) {
      if (!p.pattern.test(t)) continue;
      if (p.ruleId === "SOLVENCY-STAGE") solvency = true;
      else ids.add(p.ruleId);
    }
  }
  if (ids.size > 0) return { verdict: "reject", ruleIds: [...ids].sort(), stage: "static", texts };
  if (solvency) return { verdict: "accept", ruleIds: [], stage: "solvency", texts };
  return { verdict: "reject", ruleIds: [], stage: "other", texts };
}
