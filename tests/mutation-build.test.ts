import { describe, it, expect } from "vitest";
import { parseScenario, scenarioContentHash } from "@adversyn/core";
import { buildMutant, Ledger, type Candidate } from "@adversyn/mutation";

const ctx = { policy: "erc-8421-static:erc-8421@74a868cd" };

const seed = parseScenario({
  id: "seed-a",
  title: "Seed A",
  tags: ["valid"],
  frames: [{ role: "self_verify", mode: "VERIFY", target: "sender", limits: { execution: 30000 } }],
  expect: { verdict: "accept" },
});

const withGas = (gas: number): Candidate => ({
  field: "frames[0].limits.execution",
  original: 30000,
  mutated: gas,
  frames: [{ ...structuredClone(seed.frames[0]!), limits: { execution: gas } }],
});

describe("buildMutant", () => {
  it("builds a validated scenario with provenance and no inherited expectation", () => {
    const r = buildMutant(seed, "gas-boundary", withGas(97201), ctx, new Ledger([seed]));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.scenario.id).toMatch(/^seed-a\.gas-boundary\.[0-9a-f]{8}$/);
    expect(r.scenario.expect).toBeUndefined();
    expect(r.scenario.tags).toEqual(["valid", "mutant", "op:gas-boundary"]);
    expect(r.scenario.provenance).toMatchObject({
      parentId: "seed-a",
      parentContentHash: scenarioContentHash(seed),
      operator: "gas-boundary",
      field: "frames[0].limits.execution",
      original: 30000,
      mutated: 97201,
      policy: ctx.policy,
    });
  });

  it("is deterministic", () => {
    const a = buildMutant(seed, "gas-boundary", withGas(97201), ctx, new Ledger([seed]));
    const b = buildMutant(seed, "gas-boundary", withGas(97201), ctx, new Ledger([seed]));
    expect(a.ok && b.ok && a.scenario).toEqual(b.ok && b.scenario);
  });

  it("never modifies the parent", () => {
    const before = JSON.stringify(seed);
    buildMutant(seed, "gas-boundary", withGas(97201), ctx, new Ledger([seed]));
    expect(JSON.stringify(seed)).toBe(before);
  });

  it("skips a no-op", () => {
    const r = buildMutant(seed, "gas-boundary", withGas(30000), ctx, new Ledger([seed]));
    expect(r).toMatchObject({ ok: false });
    expect(!r.ok && r.reason).toMatch(/no-op/);
  });

  it("skips duplicate content", () => {
    const ledger = new Ledger([seed]);
    expect(buildMutant(seed, "gas-boundary", withGas(97201), ctx, ledger).ok).toBe(true);
    const again = buildMutant(seed, "other-op", withGas(97201), ctx, ledger);
    expect(again.ok).toBe(false);
    expect(!again.ok && again.reason).toMatch(/duplicate/);
  });

  it("produces distinct ids for distinct mutations", () => {
    const ledger = new Ledger([seed]);
    const a = buildMutant(seed, "gas-boundary", withGas(97201), ctx, ledger);
    const b = buildMutant(seed, "gas-boundary", withGas(97200), ctx, ledger);
    expect(a.ok && b.ok && a.scenario.id !== b.scenario.id).toBe(true);
  });

  it("avoids an id that already exists", () => {
    const first = buildMutant(seed, "gas-boundary", withGas(97201), ctx, new Ledger([seed]));
    if (!first.ok) throw new Error("setup failed");
    const taken = parseScenario({ ...structuredClone(first.scenario), frames: seed.frames });
    const r = buildMutant(seed, "gas-boundary", withGas(97201), ctx, new Ledger([seed, taken]));
    expect(r.ok && r.scenario.id).not.toBe(first.scenario.id);
  });
});
