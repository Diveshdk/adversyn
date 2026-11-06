import { describe, it, expect } from "vitest";
import path from "node:path";
import { privateKeyToAccount } from "viem/accounts";
import { parseScenario, scenarioContentHash } from "@adversyn/core";
import { loadScenarioDir } from "@adversyn/scenarios";
import { compileScenario } from "@adversyn/protocol";
import { SECP256K1_VERIFY_COST_OBSERVED } from "@adversyn/policy";
import { generateMutants, operatorIds } from "@adversyn/mutation";

const seeds = loadScenarioDir(path.resolve(process.cwd(), "scenarios/examples")).map((l) => l.scenario);
const NOW = 1_800_000_000;
const KEY = ("0x" + "33".repeat(32)) as `0x${string}`;

describe("generateMutants", () => {
  it("is deterministic across repeated runs", async () => {
    const a = await generateMutants(seeds, { nowSec: NOW });
    const b = await generateMutants(seeds, { nowSec: NOW });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.cases.length).toBeGreaterThan(0);
  });

  it("generates unique ids and content, never colliding with the seeds", async () => {
    const r = await generateMutants(seeds, { nowSec: NOW });
    const ids = r.cases.map((c) => c.scenario.id);
    expect(new Set(ids).size).toBe(ids.length);
    const seedIds = new Set(seeds.map((s) => s.id));
    expect(ids.some((id) => seedIds.has(id))).toBe(false);
    const hashes = [...seeds, ...r.cases.map((c) => c.scenario)].map(scenarioContentHash);
    expect(new Set(hashes).size).toBe(hashes.length);
  });

  it("does not modify the seeds", async () => {
    const before = JSON.stringify(seeds);
    await generateMutants(seeds, { nowSec: NOW });
    expect(JSON.stringify(seeds)).toBe(before);
  });

  it("produces schema-valid scenarios that survive a parse round trip", async () => {
    const r = await generateMutants(seeds, { nowSec: NOW });
    for (const c of r.cases) expect(parseScenario(JSON.parse(JSON.stringify(c.scenario)))).toEqual(c.scenario);
  });

  it("respects the maximum and reports truncation", async () => {
    const r = await generateMutants(seeds, { nowSec: NOW, max: 5 });
    expect(r.cases).toHaveLength(5);
    expect(r.truncated).toBeGreaterThan(0);
    const none = await generateMutants(seeds, { nowSec: NOW, max: 0 });
    expect(none.cases).toHaveLength(0);
    await expect(generateMutants(seeds, { nowSec: NOW, max: -1 })).rejects.toThrow(/non-negative/);
  });

  it("selects operators, rejects unknown ones, and works on a single seed", async () => {
    const only = await generateMutants(seeds, { nowSec: NOW, operators: ["gas-boundary"] });
    expect(only.cases.every((c) => c.scenario.provenance?.operator === "gas-boundary")).toBe(true);
    expect(only.context.operators).toEqual(["gas-boundary"]);
    await expect(generateMutants(seeds, { nowSec: NOW, operators: ["nope"] })).rejects.toThrow(/known operators/);
    const one = seeds.filter((s) => s.id === "valid-self-verify");
    const r = await generateMutants(one, { nowSec: NOW, existing: seeds });
    expect(r.cases.every((c) => c.scenario.provenance?.parentId === "valid-self-verify")).toBe(true);
  });

  it("skips what the compiler cannot build, with reasons, and never emits it", async () => {
    const r = await generateMutants(seeds, { nowSec: NOW });
    expect(r.cases.some((c) => c.scenario.frames.some((f) => f.role === "expiry_verify"))).toBe(false);
    expect(r.skipped.some((s) => s.seed === "invalid-expired-expiry")).toBe(true);
    expect(r.skipped.every((s) => s.reason.length > 0 && s.operator.length > 0 && s.seed.length > 0)).toBe(true);
  });

  it("carries the policy prediction and keeps measured values separate", async () => {
    const r = await generateMutants(seeds, { nowSec: NOW });
    expect(r.context.sigVerifyCostObserved).toBe(SECP256K1_VERIFY_COST_OBSERVED);
    for (const c of r.cases) {
      expect(c.prediction.policy).toBe(c.scenario.provenance?.policy);
      expect(c.prediction.verdict).toBe(c.prediction.violated.length > 0 ? "reject" : "accept");
      expect(c.prediction.unevaluated.length).toBeGreaterThan(0);
      expect(c.scenario.expect).toBeUndefined();
    }
    const over = r.cases.find(
      (c) => c.scenario.provenance?.operator === "gas-boundary" && c.prediction.violated.includes("BUDGET-010"),
    );
    expect(over).toBeDefined();
  });

  it("every generated case compiles", async () => {
    const r = await generateMutants(seeds, { nowSec: NOW });
    const sender = privateKeyToAccount(KEY).address;
    for (const c of r.cases) {
      await expect(
        compileScenario(c.scenario, { chainId: 1337, sender, nonce: 0n, privateKey: KEY }),
      ).resolves.toBeDefined();
    }
  });

  it("exposes the operator ids", () => {
    expect(operatorIds()).toEqual([
      "gas-boundary",
      "frame-order",
      "frame-remove",
      "frame-duplicate",
      "role",
      "atomic-flag",
    ]);
  });
});
