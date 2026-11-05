import { describe, it, expect } from "vitest";
import path from "node:path";
import { loadScenarioDir } from "@adversyn/scenarios";
import { predict } from "@adversyn/policy";
import { classifyObservation, compare } from "@adversyn/analyzer";
import { makeObservation, rejected, REAL } from "@adversyn/testkit";
import { renderMarkdown, summarize } from "@adversyn/reporter";

const all = loadScenarioDir(path.resolve(process.cwd(), "scenarios/examples"));
const get = (id: string) => {
  const hit = all.find((l) => l.scenario.id === id);
  if (!hit) throw new Error("missing scenario " + id);
  return hit.scenario;
};
const run = (id: string, sub: Parameters<typeof makeObservation>[1]) => {
  const s = get(id);
  return compare(s, predict(s), makeObservation(s, sub));
};

describe("classifyObservation on real devnet text", () => {
  it("recognises PREFIX-050", () => {
    const c = classifyObservation(makeObservation(get("invalid-verify-after-prefix"), rejected(-32602, REAL.verifyAfterPrefix)));
    expect(c).toMatchObject({ verdict: "reject", ruleIds: ["PREFIX-050"], stage: "static" });
  });
  it("recognises BUDGET-010", () => {
    const c = classifyObservation(makeObservation(get("invalid-budget-unstaked"), rejected(-32602, REAL.budget)));
    expect(c.ruleIds).toEqual(["BUDGET-010"]);
  });
  it("treats the solvency stage as static-pass", () => {
    const c = classifyObservation(makeObservation(get("valid-self-verify"), rejected(-32500, REAL.solvency)));
    expect(c).toMatchObject({ verdict: "accept", stage: "solvency", ruleIds: [] });
  });
});

describe("compare", () => {
  it("passes when the node agrees on a rejection rule", () => {
    expect(run("invalid-verify-after-prefix", rejected(-32602, REAL.verifyAfterPrefix)).result).toBe("pass");
    expect(run("invalid-budget-unstaked", rejected(-32602, REAL.budget)).result).toBe("pass");
  });
  it("passes a valid scenario that stops at solvency", () => {
    const r = run("valid-self-verify", rejected(-32500, REAL.solvency));
    expect(r.result).toBe("pass");
    expect(r.notes[0]).toMatch(/solvency/);
  });
  it("flags a node that admits what the policy rejects", () => {
    const r = run("invalid-verify-after-prefix", { outcome: "admitted", txHash: "0xabc" });
    expect(r.result).toBe("finding");
    expect(r.finding).toMatchObject({ class: "conformance", status: "violation", severity: "high" });
  });
  it("flags a node that rejects what the policy accepts", () => {
    const r = run("valid-self-verify", rejected(-32602, REAL.verifyAfterPrefix));
    expect(r.finding?.status).toBe("violation");
  });
  it("is inconclusive on an unrecognised rejection text", () => {
    const r = run("invalid-verify-after-prefix", rejected(-32602, "something entirely new"));
    expect(r.result).toBe("inconclusive");
    expect(r.finding).toBeUndefined();
  });
  it("reports submission errors without a finding", () => {
    const r = run("valid-self-verify", { outcome: "error", errorMessage: "ECONNREFUSED" });
    expect(r.result).toBe("error");
  });
  it("gives the same fingerprint for the same mismatch", () => {
    const a = run("invalid-verify-after-prefix", { outcome: "admitted" });
    const b = run("invalid-verify-after-prefix", { outcome: "admitted" });
    expect(a.finding?.fingerprint).toBe(b.finding?.fingerprint);
  });
});

describe("reporter", () => {
  it("summarises and renders findings", () => {
    const entries = [
      run("valid-self-verify", rejected(-32500, REAL.solvency)),
      run("invalid-verify-after-prefix", { outcome: "admitted" }),
    ];
    expect(summarize(entries)).toMatchObject({ total: 2, pass: 1, finding: 1 });
    const md = renderMarkdown(entries, { policy: "p", target: "t", generatedAt: "now" });
    expect(md).toContain("## Findings");
    expect(md).toContain("invalid-verify-after-prefix");
  });
});
