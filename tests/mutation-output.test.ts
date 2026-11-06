import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadScenarioDir, loadScenarioFile } from "@adversyn/scenarios";
import { generateMutants, writeOutput, buildManifest } from "@adversyn/mutation";

const seeds = loadScenarioDir(path.resolve(process.cwd(), "scenarios/examples")).map((l) => l.scenario);
const seedIds = seeds.map((s) => s.id);
const NOW = 1_800_000_000;
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "adversyn-mut-"));

describe("mutation output", () => {
  it("writes YAML scenarios that load back identically, plus a manifest", async () => {
    const result = await generateMutants(seeds, { nowSec: NOW, max: 8 });
    const dir = tmp();
    const out = writeOutput(dir, result, seedIds);
    expect(out.scenarioFiles).toHaveLength(8);
    for (const c of result.cases) {
      const file = path.join(dir, "scenarios", `${c.scenario.id}.yaml`);
      expect(loadScenarioFile(file)).toEqual(c.scenario);
    }
    const loaded = loadScenarioDir(path.join(dir, "scenarios"));
    expect(new Set(loaded.map((l) => l.scenario.id)).size).toBe(8);
    expect(fs.existsSync(path.join(dir, "manifest.json"))).toBe(true);
  });

  it("is byte-for-byte deterministic for identical inputs", async () => {
    const a = await generateMutants(seeds, { nowSec: NOW, max: 10 });
    const b = await generateMutants(seeds, { nowSec: NOW, max: 10 });
    const d1 = tmp();
    const d2 = tmp();
    writeOutput(d1, a, seedIds);
    writeOutput(d2, b, seedIds);
    expect(fs.readFileSync(path.join(d1, "manifest.json"), "utf8")).toBe(
      fs.readFileSync(path.join(d2, "manifest.json"), "utf8"),
    );
    for (const f of fs.readdirSync(path.join(d1, "scenarios"))) {
      expect(fs.readFileSync(path.join(d1, "scenarios", f), "utf8")).toBe(
        fs.readFileSync(path.join(d2, "scenarios", f), "utf8"),
      );
    }
  });

  it("refuses to overwrite unless asked, and never deletes other files", async () => {
    const result = await generateMutants(seeds, { nowSec: NOW, max: 3 });
    const dir = tmp();
    writeOutput(dir, result, seedIds);
    fs.writeFileSync(path.join(dir, "scenarios", "keep-me.txt"), "mine");
    expect(() => writeOutput(dir, result, seedIds)).toThrow(/already exists/);
    expect(() => writeOutput(dir, result, seedIds, { overwrite: true })).not.toThrow();
    expect(fs.readFileSync(path.join(dir, "scenarios", "keep-me.txt"), "utf8")).toBe("mine");
  });

  it("manifest keeps provenance, prediction and skip reasons, and makes no claims", async () => {
    const result = await generateMutants(seeds, { nowSec: NOW, max: 12 });
    const m = buildManifest(result, seedIds);
    expect(m.counts).toEqual({
      generated: result.cases.length,
      skipped: result.skipped.length,
      truncated: result.truncated,
    });
    expect(m.notice).toMatch(/None of these scenarios has been sent to a node/);
    expect(m.notice).toMatch(/no scenario here is a finding/);
    for (const c of m.cases) {
      expect(c.provenance).toMatchObject({ parentId: expect.any(String), operator: expect.any(String), field: expect.any(String) });
      expect(c.provenance).toHaveProperty("original");
      expect(c.provenance).toHaveProperty("mutated");
      expect(c.prediction.policy).toBe(c.provenance?.policy);
    }
    expect(m.skipped.every((s) => s.reason && s.seed && s.operator)).toBe(true);
    const text = JSON.stringify(m);
    expect(text).not.toMatch(/generatedAt/);
    expect(m).not.toHaveProperty("findings");
  });

  it("the generated directory is loadable by the existing scenario loader (so `adversyn run` accepts it)", async () => {
    const result = await generateMutants(seeds, { nowSec: NOW, max: 6 });
    const dir = tmp();
    writeOutput(dir, result, seedIds);
    expect(() => loadScenarioDir(path.join(dir, "scenarios"))).not.toThrow();
  });
});
