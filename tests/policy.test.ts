import { describe, it, expect } from "vitest";
import { parseScenario } from "@adversyn/core";
import { predict } from "@adversyn/policy";

const ADDR = "0x1111111111111111111111111111111111111111";
const NOW = 1_800_000_000;

type F = Record<string, unknown>;
const fr = (role: string, mode: string, execution: number, extra: F = {}): F => ({
  role,
  mode,
  target: role === "self_verify" || role === "only_verify" ? "sender" : ADDR,
  limits: { execution },
  ...extra,
});

const sc = (frames: F[], stake: F = {}) =>
  parseScenario({ id: "t", title: "t", frames, stake });

const run = (frames: F[], stake: F = {}) => predict(sc(frames, stake), { nowSec: NOW });

describe("policy: structural rules", () => {
  it("accepts a lone self_verify", () => {
    const p = run([fr("self_verify", "VERIFY", 50_000)]);
    expect(p.verdict).toBe("accept");
    expect(p.violated).toEqual([]);
    expect(p.unevaluated.length).toBeGreaterThan(0);
  });

  it("accepts only_verify + pay", () => {
    const p = run([fr("only_verify", "VERIFY", 30_000), fr("pay", "VERIFY", 50_000)]);
    expect(p.verdict).toBe("accept");
  });

  it("accepts a pre_verify before the approving frame", () => {
    const p = run([fr("pre_verify", "DEFAULT", 20_000), fr("self_verify", "VERIFY", 30_000)]);
    expect(p.verdict).toBe("accept");
  });

  it("rejects a lone only_verify (PREFIX-010)", () => {
    const p = run([fr("only_verify", "VERIFY", 30_000)]);
    expect(p.violated).toContain("PREFIX-010");
  });

  it("rejects a trailing pre_verify (PREFIX-010)", () => {
    const p = run([fr("self_verify", "VERIFY", 30_000), fr("pre_verify", "DEFAULT", 1000)]);
    expect(p.verdict).toBe("accept");
    const q = run([fr("pre_verify", "DEFAULT", 1000), fr("execution", "SENDER", 1000)]);
    expect(q.violated).toContain("PREFIX-010");
  });

  it("flags a deploy frame that is not first (PREFIX-020)", () => {
    const p = run([
      fr("only_verify", "VERIFY", 30_000),
      fr("deploy", "DEFAULT", 30_000),
      fr("pay", "VERIFY", 30_000),
    ]);
    expect(p.violated).toEqual(expect.arrayContaining(["PREFIX-010", "PREFIX-020"]));
  });

  it("flags the atomic flag in the prefix (PREFIX-040)", () => {
    const p = run([fr("self_verify", "VERIFY", 30_000, { atomicBatch: true })]);
    expect(p.violated).toContain("PREFIX-040");
  });

  it("flags a VERIFY frame after the prefix (PREFIX-050)", () => {
    const p = run([fr("self_verify", "VERIFY", 30_000), fr("execution", "VERIFY", 1000)]);
    expect(p.violated).toEqual(["PREFIX-050"]);
  });

  it("flags an expired expiry_verify (PREFIX-080) but not a future one", () => {
    const past = run([
      fr("expiry_verify", "VERIFY", 5000, { extra: { deadline: NOW - 1 } }),
      fr("self_verify", "VERIFY", 30_000),
    ]);
    expect(past.violated).toEqual(["PREFIX-080"]);
    const future = run([
      fr("expiry_verify", "VERIFY", 5000, { extra: { deadline: NOW + 60 } }),
      fr("self_verify", "VERIFY", 30_000),
    ]);
    expect(future.verdict).toBe("accept");
  });

  it("flags a stray DEFAULT frame in the prefix (PREFIX-120)", () => {
    const p = run([fr("execution", "DEFAULT", 1000), fr("self_verify", "VERIFY", 30_000)]);
    expect(p.violated).toContain("PREFIX-120");
  });
});

describe("policy: BUDGET-010", () => {
  it("rejects 100,001 gas for an unstaked sender", () => {
    const p = run([fr("self_verify", "VERIFY", 100_001)]);
    expect(p.violated).toEqual(["BUDGET-010"]);
  });
  it("allows exactly 100,000 for an unstaked sender", () => {
    expect(run([fr("self_verify", "VERIFY", 100_000)]).verdict).toBe("accept");
  });
  it("allows 100,001 for a staked sender, but not 1,000,001", () => {
    expect(run([fr("self_verify", "VERIFY", 100_001)], { sender: true }).verdict).toBe("accept");
    expect(run([fr("self_verify", "VERIFY", 1_000_001)], { sender: true }).violated).toEqual(["BUDGET-010"]);
  });
  it("counts the budget per entity, not for the whole prefix", () => {
    const p = run([fr("only_verify", "VERIFY", 90_000), fr("pay", "VERIFY", 90_000)]);
    expect(p.verdict).toBe("accept");
  });
  it("attributes a pre_verify frame to the entity it precedes", () => {
    const p = run([fr("pre_verify", "DEFAULT", 60_000), fr("self_verify", "VERIFY", 60_000)]);
    expect(p.violated).toEqual(["BUDGET-010"]);
  });
});
