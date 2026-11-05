import { describe, it, expect } from "vitest";
import {
  canonicalize,
  parseScenario,
  scenarioHash,
  makeFingerprint,
  Finding,
  type PolicyRef,
} from "@adversyn/core";

const policy: PolicyRef = {
  id: "erc-8421",
  pins: [{ spec: "erc-8421", commit: "74a868cd" }],
};

const baseScenario = {
  id: "prefix-self-verify-ok",
  title: "Single self_verify frame",
  exercises: ["PREFIX-010"],
  frames: [
    {
      role: "self_verify",
      mode: "VERIFY",
      target: "sender",
      limits: { execution: 50000 },
    },
  ],
};

describe("canonicalize", () => {
  it("is independent of key order", () => {
    expect(canonicalize({ b: 1, a: { d: 2, c: 3 } })).toBe(
      canonicalize({ a: { c: 3, d: 2 }, b: 1 }),
    );
  });
  it("rejects undefined at top level", () => {
    expect(() => canonicalize(undefined)).toThrow();
  });
});

describe("Scenario", () => {
  it("parses and applies defaults", () => {
    const s = parseScenario(baseScenario);
    expect(s.sender).toBe("generated");
    expect(s.nonce.keys).toEqual(["0"]);
    expect(s.frames[0]!.data).toBe("0x");
    expect(s.stake.sender).toBe(false);
  });
  it("rejects more than 64 frames", () => {
    const frames = Array.from({ length: 65 }, () => baseScenario.frames[0]);
    expect(() => parseScenario({ ...baseScenario, frames })).toThrow();
  });
  it("rejects a malformed address", () => {
    const bad = {
      ...baseScenario,
      frames: [{ ...baseScenario.frames[0], target: "0x1234" }],
    };
    expect(() => parseScenario(bad)).toThrow();
  });
  it("hash ignores title but not frames", () => {
    const a = parseScenario(baseScenario);
    const b = parseScenario({ ...baseScenario, title: "renamed" });
    const c = parseScenario({
      ...baseScenario,
      frames: [{ ...baseScenario.frames[0], limits: { execution: 60000 } }],
    });
    expect(scenarioHash(a)).toBe(scenarioHash(b));
    expect(scenarioHash(a)).not.toBe(scenarioHash(c));
  });
});

describe("Finding fingerprint", () => {
  const base = {
    class: "conformance" as const,
    policy,
    scenarioHash: "abc",
    expected: { verdict: "reject" as const, ruleIds: ["PREFIX-050"] },
    observed: { verdict: "accept" as const, ruleIds: [] },
  };
  it("is stable", () => {
    expect(makeFingerprint(base)).toBe(makeFingerprint({ ...base }));
  });
  it("changes when the observed verdict changes", () => {
    const other = { ...base, observed: { verdict: "reject" as const, ruleIds: [] } };
    expect(makeFingerprint(base)).not.toBe(makeFingerprint(other));
  });
  it("round-trips through the Finding schema", () => {
    const f = Finding.parse({
      fingerprint: makeFingerprint(base),
      class: "conformance",
      status: "violation",
      severity: "medium",
      title: "VERIFY after prefix was admitted",
      policy,
      scenarioId: "x",
      scenarioHash: "abc",
      runId: "r1",
      expected: base.expected,
      observed: base.observed,
      evidence: { notes: [] },
      detectedAt: new Date().toISOString(),
    });
    expect(f.status).toBe("violation");
  });
});
