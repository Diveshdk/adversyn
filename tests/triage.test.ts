import { describe, it, expect } from "vitest";
import path from "node:path";
import { loadScenarioDir } from "@adversyn/scenarios";
import { predict } from "@adversyn/policy";
import { compare } from "@adversyn/analyzer";
import { runScenario, type Target } from "@adversyn/executor";
import { makeObservation, rejected } from "@adversyn/testkit";

const all = loadScenarioDir(path.resolve(process.cwd(), "scenarios/examples"));
const get = (id: string) => all.find((l) => l.scenario.id === id)!.scenario;

describe("validation-stage rejections", () => {
  it("are inconclusive, never a finding", () => {
    const s = get("valid-only-verify-pay");
    const text = "validation frame 1: the frame's default code reported failure";
    const r = compare(s, predict(s), makeObservation(s, rejected(-32500, text)));
    expect(r.result).toBe("inconclusive");
    expect(r.finding).toBeUndefined();
    expect(r.notes.join(" ")).toContain(text);
  });

  it("de-duplicates the node message", () => {
    const s = get("invalid-lone-only-verify");
    const obs = makeObservation(s, {
      ...rejected(-32602, "brand new wording"),
      reasons: [{ text: "brand new wording", source: "rpc-error" }],
    });
    const r = compare(s, predict(s), obs);
    expect(r.notes.filter((n) => n.includes("brand new wording")).length).toBe(1);
  });
});

describe("executor skips", () => {
  it("scenarios tagged needs-deployed-contract", async () => {
    const t: Target = {
      cfg: { name: "x", rpcUrl: "x://", chainId: 1 },
      submit: async () => ({ ok: true, result: "0x" }),
      getNonce: async () => 0n,
    };
    const r = await runScenario(t, get("valid-only-verify-pay"), { runId: "t" });
    expect(r.kind).toBe("skipped");
  });
});

describe("PREFIX-010 wording from the real devnet", () => {
  it("attributes the generic prefix rejection to PREFIX-010", () => {
    const s = get("invalid-lone-only-verify");
    const r = compare(
      s,
      predict(s),
      makeObservation(s, rejected(-32602, "frame transaction validation prefix not recognized")),
    );
    expect(r.result).toBe("pass");
    expect(r.observed.ruleIds).toEqual(["PREFIX-010"]);
  });
});

describe("solvency-stage stops and non-structural rules", () => {
  const solvency = "validation frame 0: the payer 0x94b821d4cae56eb2691503b3d749fddc17f259cb has 0 wei, the transaction's maximum cost is 605652000000000 wei";

  it("is inconclusive for rules that need simulation", () => {
    const s = get("invalid-stray-default-frame");
    const r = compare(s, predict(s), makeObservation(s, rejected(-32500, solvency)));
    expect(r.result).toBe("inconclusive");
    expect(r.finding).toBeUndefined();
  });

  it("still flags an admission of a structurally invalid transaction", () => {
    const s = get("invalid-verify-after-prefix");
    const r = compare(s, predict(s), makeObservation(s, { outcome: "admitted" }));
    expect(r.result).toBe("finding");
  });
});

describe("PREFIX-040 wording from the real devnet", () => {
  it("attributes the atomic-flag rejection to PREFIX-040", () => {
    const s = get("invalid-atomic-in-prefix");
    const r = compare(
      s,
      predict(s),
      makeObservation(s, rejected(-32602, "frame 0 in validation prefix has ATOMIC_BATCH_FLAG set")),
    );
    expect(r.result).toBe("pass");
    expect(r.observed.ruleIds).toEqual(["PREFIX-040"]);
  });
});
