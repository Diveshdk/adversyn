import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { loadScenarioDir } from "@adversyn/scenarios";
import { buildManifest, generateMutants, scenarioToYaml } from "@adversyn/mutation";

const root = path.resolve(process.cwd(), "scenarios/generated");
const all = loadScenarioDir(path.resolve(process.cwd(), "scenarios/examples")).map((s) => s.scenario);

describe("committed generated scenarios", () => {
  it("match what the generator produces from the manifest's recorded inputs", async () => {
    const text = fs.readFileSync(path.join(root, "manifest.json"), "utf8");
    const committed = JSON.parse(text);
    const seeds = all.filter((s) => committed.seeds.includes(s.id));
    const result = await generateMutants(seeds, {
      nowSec: committed.context.nowSec,
      operators: committed.context.operators,
      max: committed.context.max ?? undefined,
      existing: all,
    });
    expect(JSON.stringify(buildManifest(result, committed.seeds), null, 2) + "\n").toBe(text);
    for (const c of result.cases) {
      const file = path.join(root, "scenarios", `${c.scenario.id}.yaml`);
      expect(fs.readFileSync(file, "utf8")).toBe(scenarioToYaml(c.scenario));
    }
    expect(fs.readdirSync(path.join(root, "scenarios")).length).toBe(result.cases.length);
  });

  it("loads with the existing loader and carries provenance and no expectation", () => {
    const loaded = loadScenarioDir(path.join(root, "scenarios"));
    expect(loaded.length).toBeGreaterThan(0);
    for (const { scenario } of loaded) {
      expect(scenario.provenance?.parentId).toBeTruthy();
      expect(scenario.expect).toBeUndefined();
    }
  });
});
