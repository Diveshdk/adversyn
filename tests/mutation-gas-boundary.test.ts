import { describe, it, expect } from "vitest";
import { parseScenario } from "@adversyn/core";
import {
  predict,
  MAX_VERIFY_GAS_PER_ENTITY,
  MAX_VERIFY_GAS_STAKED_ENTITY,
  SECP256K1_VERIFY_COST_OBSERVED,
} from "@adversyn/policy";
import { gasBoundary, buildMutant, Ledger } from "@adversyn/mutation";

const ctx = { policy: "erc-8421-static:erc-8421@74a868cd" };
const PAYER = "0x2222222222222222222222222222222222222222";
const RECIPIENT = "0x8943545177806ED17B9F23F0a21ee5948eCaa776";

const selfVerify = (stake: object = {}) =>
  parseScenario({
    id: "seed-self",
    title: "seed",
    stake,
    frames: [
      { role: "self_verify", mode: "VERIFY", target: "sender", limits: { execution: 30000 } },
      { role: "execution", mode: "SENDER", target: RECIPIENT, limits: { execution: 50000 } },
    ],
  });

const sponsored = parseScenario({
  id: "seed-sponsored",
  title: "seed",
  frames: [
    { role: "only_verify", mode: "VERIFY", target: "sender", limits: { execution: 30000 } },
    { role: "pay", mode: "VERIFY", target: PAYER, limits: { execution: 50000 } },
    { role: "execution", mode: "SENDER", target: RECIPIENT, limits: { execution: 50000 } },
  ],
});

const values = (r: ReturnType<typeof gasBoundary.generate>, field: string) =>
  r.candidates.filter((c) => c.field === field).map((c) => c.mutated);

describe("gas-boundary operator", () => {
  it("finds the unstaked sender boundary from the policy constants", () => {
    const r = gasBoundary.generate(selfVerify(), ctx);
    const edge = MAX_VERIFY_GAS_PER_ENTITY - SECP256K1_VERIFY_COST_OBSERVED;
    expect(values(r, "frames[0].limits.execution")).toEqual([edge, edge + 1]);
  });

  it("finds the staked sender boundary", () => {
    const r = gasBoundary.generate(selfVerify({ sender: true }), ctx);
    const edge = MAX_VERIFY_GAS_STAKED_ENTITY - SECP256K1_VERIFY_COST_OBSERVED;
    expect(values(r, "frames[0].limits.execution")).toEqual([edge, edge + 1]);
  });

  it("counts the signature cost for the sender only, not a separate payer", () => {
    const r = gasBoundary.generate(sponsored, ctx);
    expect(values(r, "frames[0].limits.execution")).toEqual([
      MAX_VERIFY_GAS_PER_ENTITY - SECP256K1_VERIFY_COST_OBSERVED,
      MAX_VERIFY_GAS_PER_ENTITY - SECP256K1_VERIFY_COST_OBSERVED + 1,
    ]);
    expect(values(r, "frames[1].limits.execution")).toEqual([
      MAX_VERIFY_GAS_PER_ENTITY,
      MAX_VERIFY_GAS_PER_ENTITY + 1,
    ]);
  });

  it("emits a pair the policy agrees is pass then fail", () => {
    const seed = selfVerify();
    const r = gasBoundary.generate(seed, ctx);
    const [pass, fail] = r.candidates;
    expect(predict({ ...seed, frames: pass!.frames }).violated).not.toContain("BUDGET-010");
    expect(predict({ ...seed, frames: fail!.frames }).violated).toContain("BUDGET-010");
  });

  it("skips frames the policy does not count, with a reason", () => {
    const r = gasBoundary.generate(selfVerify(), ctx);
    expect(r.skipped).toHaveLength(1);
    expect(r.skipped[0]).toMatchObject({ operator: "gas-boundary", field: "frames[1].limits.execution" });
    expect(r.skipped[0]!.reason).toMatch(/not counted/);
  });

  it("skips a frame that cannot fix an overrun caused by another entity", () => {
    const seed = parseScenario({
      id: "seed-over",
      title: "seed",
      frames: [
        { role: "only_verify", mode: "VERIFY", target: "sender", limits: { execution: 99999 } },
        { role: "pay", mode: "VERIFY", target: PAYER, limits: { execution: 30000 } },
      ],
    });
    const r = gasBoundary.generate(seed, ctx);
    // Frame 0 is the culprit: lowering it fixes the budget, so it has a boundary.
    expect(values(r, "frames[0].limits.execution")).toEqual([
      MAX_VERIFY_GAS_PER_ENTITY - SECP256K1_VERIFY_COST_OBSERVED,
      MAX_VERIFY_GAS_PER_ENTITY - SECP256K1_VERIFY_COST_OBSERVED + 1,
    ]);
    // Frame 1 (the payer) cannot fix the sender's overrun, so there is no boundary to find there.
    expect(values(r, "frames[1].limits.execution")).toEqual([]);
    expect(
      r.skipped.some((s) => s.field === "frames[1].limits.execution" && /over budget/.test(s.reason)),
    ).toBe(true);
  });

  it("is deterministic and leaves the parent untouched", () => {
    const seed = selfVerify();
    const before = JSON.stringify(seed);
    const a = gasBoundary.generate(seed, ctx);
    const b = gasBoundary.generate(seed, ctx);
    expect(a).toEqual(b);
    expect(JSON.stringify(seed)).toBe(before);
  });

  it("produces valid scenarios through buildMutant, skipping the no-op", () => {
    const seed = selfVerify();
    const ledger = new Ledger([seed]);
    const results = gasBoundary
      .generate(seed, ctx)
      .candidates.map((c) => buildMutant(seed, gasBoundary.id, c, ctx, ledger));
    expect(results.filter((r) => r.ok)).toHaveLength(2);
  });
});
