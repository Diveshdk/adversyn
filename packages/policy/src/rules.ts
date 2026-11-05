import type { Frame, Scenario } from "@adversyn/core";
import { normalizeRoles, stripLeadingExpiry, type PrefixInfo } from "./prefix.js";
import type { EvalContext, Rule, RuleOutcome } from "./types.js";

export const MAX_VERIFY_GAS_PER_ENTITY = 100_000;
export const MAX_VERIFY_GAS_STAKED_ENTITY = 1_000_000;

const ALLOWED_SHAPES = new Set([
  "self_verify",
  "deploy,self_verify",
  "only_verify,pay",
  "deploy,only_verify,pay",
]);

const pass = (ruleId: string, detail?: string): RuleOutcome => ({ ruleId, status: "pass", detail });
const fail = (ruleId: string, detail: string): RuleOutcome => ({ ruleId, status: "fail", detail });
const na = (ruleId: string, detail: string): RuleOutcome => ({ ruleId, status: "not-applicable", detail });

const prefix010: Rule = {
  id: "PREFIX-010",
  summary: "Validation prefix must match one of the allowed shapes",
  evaluate(_s, p) {
    if (!p.hasApprover) return fail("PREFIX-010", "no self_verify or pay frame found, so no payer is set");
    const norm = normalizeRoles(stripLeadingExpiry(p.frames));
    if (!norm.ok) return fail("PREFIX-010", norm.why);
    const shape = norm.roles.join(",");
    return ALLOWED_SHAPES.has(shape)
      ? pass("PREFIX-010", shape)
      : fail("PREFIX-010", `shape [${shape}] is not allowed`);
  },
};

const prefix020: Rule = {
  id: "PREFIX-020",
  summary: "A deploy frame must be first (after an optional expiry_verify) and unique",
  evaluate(_s, p) {
    if (!p.hasApprover) return na("PREFIX-020", "no prefix");
    const frames = stripLeadingExpiry(p.frames);
    const deploys = frames.filter((f) => f.role === "deploy");
    if (deploys.length === 0) return na("PREFIX-020", "no deploy frame");
    if (deploys.length > 1) return fail("PREFIX-020", "more than one deploy frame");
    return frames[0]?.role === "deploy"
      ? pass("PREFIX-020")
      : fail("PREFIX-020", "deploy frame is not first in the prefix");
  },
};

const prefix040: Rule = {
  id: "PREFIX-040",
  summary: "No prefix frame may carry the atomic batch flag",
  evaluate(_s, p) {
    if (!p.hasApprover) return na("PREFIX-040", "no prefix");
    const bad = p.frames.findIndex((f) => f.atomicBatch);
    return bad >= 0 ? fail("PREFIX-040", `prefix frame ${bad} has atomicBatch`) : pass("PREFIX-040");
  },
};

const prefix050: Rule = {
  id: "PREFIX-050",
  summary: "No VERIFY frame may follow the validation prefix",
  evaluate(_s, p) {
    if (!p.hasApprover) return na("PREFIX-050", "no prefix");
    const bad = p.rest.findIndex((f) => f.mode === "VERIFY");
    return bad >= 0
      ? fail("PREFIX-050", `VERIFY frame at body position ${bad} after the prefix`)
      : pass("PREFIX-050");
  },
};

const prefix080: Rule = {
  id: "PREFIX-080",
  summary: "An expiry_verify deadline earlier than the current block time is rejected",
  evaluate(_s, p, ctx: EvalContext) {
    const f = p.frames.find((x) => x.role === "expiry_verify");
    if (!f) return na("PREFIX-080", "no expiry_verify frame");
    const deadline = f.extra?.["deadline"];
    if (typeof deadline !== "number") {
      return na("PREFIX-080", "expiry_verify frame has no numeric extra.deadline");
    }
    return deadline < ctx.nowSec
      ? fail("PREFIX-080", `deadline ${deadline} is before now ${ctx.nowSec}`)
      : pass("PREFIX-080");
  },
};

const prefix120: Rule = {
  id: "PREFIX-120",
  summary: "A DEFAULT-mode prefix frame must be the deploy frame or a pre_verify frame",
  evaluate(_s, p) {
    if (!p.hasApprover) return na("PREFIX-120", "no prefix");
    const bad = p.frames.findIndex(
      (f) => f.mode === "DEFAULT" && f.role !== "deploy" && f.role !== "pre_verify",
    );
    return bad >= 0
      ? fail("PREFIX-120", `DEFAULT-mode prefix frame ${bad} is neither deploy nor pre_verify`)
      : pass("PREFIX-120");
  },
};

type Entity = "sender" | "payer" | "factory";

function entityOf(f: Frame, next: Frame | undefined): Entity | null {
  switch (f.role) {
    case "self_verify":
    case "only_verify":
      return "sender";
    case "pay":
      return f.target === "sender" ? "sender" : "payer";
    case "deploy":
      return "factory";
    case "pre_verify":
      return next ? entityOf(next, undefined) : null;
    default:
      return null;
  }
}

const budget010: Rule = {
  id: "BUDGET-010",
  summary: "Per-entity verification gas: 100k unstaked, 1M staked",
  evaluate(s: Scenario, p: PrefixInfo) {
    if (!p.hasApprover) return na("BUDGET-010", "no prefix");
    const totals: Record<Entity, number> = { sender: 0, payer: 0, factory: 0 };
    p.frames.forEach((f, i) => {
      const e = entityOf(f, p.frames[i + 1]);
      if (e) totals[e] += f.limits.execution;
    });
    for (const e of ["sender", "payer", "factory"] as const) {
      const cap = s.stake[e] ? MAX_VERIFY_GAS_STAKED_ENTITY : MAX_VERIFY_GAS_PER_ENTITY;
      if (totals[e] > cap) {
        return fail(
          "BUDGET-010",
          `${e} verification gas ${totals[e]} exceeds ${cap} (${s.stake[e] ? "staked" : "unstaked"}); signature intrinsic cost not modelled`,
        );
      }
    }
    return pass("BUDGET-010", "signature intrinsic cost not modelled");
  },
};

export const RULES: Rule[] = [prefix010, prefix020, prefix040, prefix050, prefix080, prefix120, budget010];

export const UNEVALUATED = [
  "SIGNATURE-010",
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
