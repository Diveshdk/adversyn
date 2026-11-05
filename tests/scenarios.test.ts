import { describe, it, expect } from "vitest";
import path from "node:path";
import { loadScenarioDir } from "@adversyn/scenarios";
import { predict } from "@adversyn/policy";

const dir = path.resolve(process.cwd(), "scenarios/examples");
const loaded = loadScenarioDir(dir);

describe("example scenarios", () => {
  it("loads at least twelve with unique ids", () => {
    expect(loaded.length).toBeGreaterThanOrEqual(12);
    expect(new Set(loaded.map((l) => l.scenario.id)).size).toBe(loaded.length);
  });

  for (const { file, scenario } of loaded) {
    it(`${scenario.id}: policy prediction matches its declared expectation`, () => {
      expect(scenario.expect, `${file} has no expect block`).toBeDefined();
      const p = predict(scenario);
      expect(p.verdict).toBe(scenario.expect!.verdict);
      expect([...p.violated].sort()).toEqual([...scenario.expect!.ruleIds].sort());
    });
  }
});
