import { describe, it, expect } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { parseScenario } from "@adversyn/core";
import { predict } from "@adversyn/policy";
import { compileScenario } from "@adversyn/protocol";
import { atomicFlag, buildMutant, Ledger } from "@adversyn/mutation";

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

describe("atomic-flag operator", () => {
  it("emits one toggle per frame, off to on", () => {
    const r = atomicFlag.generate(selfVerify, ctx);
    expect(r.skipped).toEqual([]);
    expect(r.candidates.map((c) => [c.field, c.original, c.mutated])).toEqual([
      ["frames[0].atomicBatch", false, true],
      ["frames[1].atomicBatch", false, true],
    ]);
    expect(r.candidates[0]!.frames.map((f) => f.atomicBatch)).toEqual([true, false]);
    expect(r.candidates[1]!.frames.map((f) => f.atomicBatch)).toEqual([false, true]);
  });

  it("toggles on to off", () => {
    const seed = parseScenario({
      id: "seed-on",
      title: "seed",
      frames: [
        { role: "execution", mode: "SENDER", target: RECIPIENT, limits: { execution: 1000 }, atomicBatch: true },
        { role: "execution", mode: "SENDER", target: RECIPIENT, limits: { execution: 1000 } },
      ],
    });
    const c = atomicFlag.generate(seed, ctx).candidates[0]!;
    expect([c.original, c.mutated]).toEqual([true, false]);
  });

  it("skips expiry_verify frames, which the compiler cannot map", () => {
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
    const r = atomicFlag.generate(seed, ctx);
    expect(r.candidates).toHaveLength(1);
    expect(r.skipped).toHaveLength(1);
    expect(r.skipped[0]!.reason).toMatch(/expiry_verify/);
  });

  it("is deterministic and leaves the parent untouched", () => {
    const before = JSON.stringify(selfVerify);
    expect(atomicFlag.generate(selfVerify, ctx)).toEqual(atomicFlag.generate(selfVerify, ctx));
    expect(JSON.stringify(selfVerify)).toBe(before);
  });

  it("policy integration: a flag on the prefix is predicted to violate PREFIX-040, one on the body is not", () => {
    const [onPrefix, onBody] = atomicFlag.generate(selfVerify, ctx).candidates;
    const p0 = predict({ ...selfVerify, frames: onPrefix!.frames });
    expect(p0.verdict).toBe("reject");
    expect(p0.violated).toEqual(["PREFIX-040"]);
    const p1 = predict({ ...selfVerify, frames: onBody!.frames });
    expect(p1.violated).not.toContain("PREFIX-040");
    expect(p1.verdict).toBe("accept");
    expect(p1.unevaluated.length).toBeGreaterThan(0);
  });

  it("the flag reaches the wire: every mutant compiles to a different transaction", async () => {
    const parent = await compile(selfVerify);
    const ledger = new Ledger([selfVerify]);
    for (const c of atomicFlag.generate(selfVerify, ctx).candidates) {
      const built = buildMutant(selfVerify, atomicFlag.id, c, ctx, ledger);
      expect(built.ok).toBe(true);
      if (!built.ok) continue;
      expect((await compile(built.scenario)).hash).not.toBe(parent.hash);
    }
  });
});
