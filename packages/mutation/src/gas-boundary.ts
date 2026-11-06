import type { Frame, Scenario } from "@adversyn/core";
import { predict } from "@adversyn/policy";
import type { Candidate, MutationOperator, Skip } from "./types.js";

export const GAS_BOUNDARY_ID = "gas-boundary";

// Roles the policy counts toward per-entity verification gas (see policy BUDGET-010).
const BUDGET_ROLES = new Set(["self_verify", "only_verify", "pay", "deploy", "pre_verify"]);

// Upper limit of the boundary search. Staked entities are allowed 1,000,000, so this leaves headroom.
const SEARCH_CEILING = 10_000_000;

function withExecution(frames: Frame[], index: number, value: number): Frame[] {
  return frames.map((f, i) => {
    const copy = structuredClone(f);
    if (i === index) copy.limits = { ...copy.limits, execution: value };
    return copy;
  });
}

function overBudget(seed: Scenario, index: number, value: number): boolean {
  const probe: Scenario = { ...seed, frames: withExecution(seed.frames, index, value) };
  return predict(probe).violated.includes("BUDGET-010");
}

export const gasBoundary: MutationOperator = {
  id: GAS_BOUNDARY_ID,
  description:
    "For each budget-counted frame, set limits.execution to the last value the policy accepts and the first it rejects for BUDGET-010.",
  generate(seed) {
    const candidates: Candidate[] = [];
    const skipped: Skip[] = [];

    seed.frames.forEach((frame, index) => {
      const field = `frames[${index}].limits.execution`;
      if (!frame.role || !BUDGET_ROLES.has(frame.role)) {
        skipped.push({
          operator: GAS_BOUNDARY_ID,
          field,
          reason: `role ${frame.role ?? "(none)"} is not counted toward verification gas by the policy`,
        });
        return;
      }
      if (overBudget(seed, index, 0)) {
        skipped.push({
          operator: GAS_BOUNDARY_ID,
          field,
          reason: "the scenario is over budget even with this frame at 0 gas, so there is no boundary to find here",
        });
        return;
      }
      if (!overBudget(seed, index, SEARCH_CEILING)) {
        skipped.push({
          operator: GAS_BOUNDARY_ID,
          field,
          reason: `the policy reports no BUDGET-010 violation up to ${SEARCH_CEILING}`,
        });
        return;
      }

      let lo = 0;
      let hi = SEARCH_CEILING;
      while (hi - lo > 1) {
        const mid = Math.floor((lo + hi) / 2);
        if (overBudget(seed, index, mid)) hi = mid;
        else lo = mid;
      }
      for (const value of [lo, hi]) {
        candidates.push({
          field,
          original: frame.limits.execution,
          mutated: value,
          frames: withExecution(seed.frames, index, value),
        });
      }
    });

    return { candidates, skipped };
  },
};
