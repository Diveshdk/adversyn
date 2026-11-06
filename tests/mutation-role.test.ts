import { describe, it, expect } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { parseScenario } from "@adversyn/core";
import { approveScopeFor, compileScenario } from "@adversyn/protocol";
import { roleMutation, buildMutant, Ledger } from "@adversyn/mutation";

const ctx = { policy: "erc-8421-static:erc-8421@74a868cd" };
const RECIPIENT = "0x8943545177806ED17B9F23F0a21ee5948eCaa776";
const KEY = ("0x" + "11".repeat(32)) as `0x${string}`;
const SENDER = privateKeyToAccount(KEY).address;

const selfVerify = parseScenario({
  id: "seed-self",
  title: "seed",
  frames: [
    { role: "self_verify", mode: "VERIFY", target: "sender", limits: { execution: 30000 } },
    { role: "execution", mode: "SENDER", target: RECIPIENT, limits: { execution: 50000 } },
  ],
});

const compile = (s: typeof selfVerify) =>
  compileScenario(s, { chainId: 1337, sender: SENDER, nonce: 0n, privateKey: KEY });

describe("approveScopeFor", () => {
  it("only VERIFY frames carry a scope, and only some roles change it", () => {
    expect(approveScopeFor({ role: "self_verify", mode: "VERIFY" })).toBe("EXECUTION_AND_PAYMENT");
    expect(approveScopeFor({ role: "only_verify", mode: "VERIFY" })).toBe("EXECUTION");
    expect(approveScopeFor({ role: "pay", mode: "VERIFY" })).toBe("PAYMENT");
    expect(approveScopeFor({ role: "deploy", mode: "VERIFY" })).toBe("EXECUTION_AND_PAYMENT");
    expect(approveScopeFor({ role: "pay", mode: "SENDER" })).toBeUndefined();
  });
});

describe("role operator", () => {
  it("emits only the role changes that change the scope", () => {
    const r = roleMutation.generate(selfVerify, ctx);
    const mutated = r.candidates.filter((c) => c.field === "frames[0].role").map((c) => c.mutated);
    expect(mutated).toEqual(["only_verify", "pay"]);
  });

  it("skips label-only changes, with a reason, and aggregates them per frame", () => {
    const r = roleMutation.generate(selfVerify, ctx);
    const labelOnly = r.skipped.filter((s) => /label-only/.test(s.reason));
    expect(labelOnly.map((s) => s.field)).toEqual(["frames[0].role", "frames[1].role"]);
    expect(labelOnly[0]!.reason).toMatch(/deploy/);
  });

  it("emits nothing for a SENDER frame, since its role never reaches the wire", () => {
    const r = roleMutation.generate(selfVerify, ctx);
    expect(r.candidates.some((c) => c.field === "frames[1].role")).toBe(false);
  });

  it("skips a seed frame whose role the compiler cannot map", () => {
    const seed = parseScenario({
      id: "seed-expiry",
      title: "seed",
      frames: [
        {
          role: "expiry_verify",
          mode: "VERIFY",
          target: "0x0000000000000000000000000000000000000000",
          limits: { execution: 5000 },
          extra: { deadline: 4102444800 },
        },
        { role: "self_verify", mode: "VERIFY", target: "sender", limits: { execution: 30000 } },
      ],
    });
    const r = roleMutation.generate(seed, ctx);
    expect(r.skipped.some((s) => s.field === "frames[0].role" && /cannot be compiled/.test(s.reason))).toBe(true);
    expect(r.candidates.some((c) => c.field === "frames[0].role")).toBe(false);
  });

  it("is deterministic and leaves the parent untouched", () => {
    const before = JSON.stringify(selfVerify);
    expect(roleMutation.generate(selfVerify, ctx)).toEqual(roleMutation.generate(selfVerify, ctx));
    expect(JSON.stringify(selfVerify)).toBe(before);
  });

  it("wire-changing mutants really compile to a different transaction", async () => {
    const parent = await compile(selfVerify);
    const ledger = new Ledger([selfVerify]);
    for (const c of roleMutation.generate(selfVerify, ctx).candidates) {
      const built = buildMutant(selfVerify, roleMutation.id, c, ctx, ledger);
      expect(built.ok).toBe(true);
      if (!built.ok) continue;
      const out = await compile(built.scenario);
      expect(out.hash).not.toBe(parent.hash);
    }
  });

  it("the skipped label-only change really is the same transaction (premise check)", async () => {
    const asDeploy = parseScenario({
      ...structuredClone(selfVerify),
      frames: selfVerify.frames.map((f, i) => (i === 0 ? { ...f, role: "deploy" } : f)),
    });
    expect((await compile(asDeploy)).hash).toBe((await compile(selfVerify)).hash);
  });
});
