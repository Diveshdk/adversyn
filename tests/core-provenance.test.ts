import { describe, it, expect } from "vitest";
import { parseScenario, scenarioHash, scenarioContentHash } from "@adversyn/core";

const base = {
  id: "seed-a",
  title: "Seed A",
  frames: [{ role: "self_verify", mode: "VERIFY", target: "sender", limits: { execution: 30000 } }],
};

const provenance = {
  parentId: "seed-a",
  parentContentHash: "abc",
  operator: "gas-boundary",
  field: "frames[0].limits.execution",
  original: 30000,
  mutated: 97201,
  policy: "erc-8421-static:erc-8421@74a868cd",
  generation: { tool: "adversyn-mutate", version: 1 },
};

describe("scenario provenance", () => {
  it("is optional and survives parsing", () => {
    expect(parseScenario(base).provenance).toBeUndefined();
    const s = parseScenario({ ...base, id: "seed-a.m1", provenance });
    expect(s.provenance?.operator).toBe("gas-boundary");
    expect(s.provenance?.original).toBe(30000);
  });

  it("does not change scenarioHash", () => {
    expect(scenarioHash(parseScenario({ ...base, provenance }))).toBe(scenarioHash(parseScenario(base)));
  });

  it("content hash ignores id, title, tags and provenance but not frames", () => {
    const a = parseScenario(base);
    const b = parseScenario({ ...base, id: "other", title: "x", tags: ["t"], provenance });
    const c = parseScenario({ ...base, frames: [{ ...base.frames[0], limits: { execution: 30001 } }] });
    expect(scenarioContentHash(b)).toBe(scenarioContentHash(a));
    expect(scenarioContentHash(c)).not.toBe(scenarioContentHash(a));
  });
});
