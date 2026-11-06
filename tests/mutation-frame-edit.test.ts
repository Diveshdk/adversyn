import { describe, it, expect } from "vitest";
import { parseScenario } from "@adversyn/core";
import { predict } from "@adversyn/policy";
import { frameRemove, frameDuplicate, buildMutant, Ledger } from "@adversyn/mutation";

const ctx = { policy: "erc-8421-static:erc-8421@74a868cd" };
const RECIPIENT = "0x8943545177806ED17B9F23F0a21ee5948eCaa776";

const selfVerify = parseScenario({
  id: "seed-self",
  title: "seed",
  frames: [
    { role: "self_verify", mode: "VERIFY", target: "sender", limits: { execution: 30000 } },
    { role: "execution", mode: "SENDER", target: RECIPIENT, limits: { execution: 50000 } },
  ],
});

describe("frame-remove operator", () => {
  it("emits one removal per frame, in order", () => {
    const r = frameRemove.generate(selfVerify, ctx);
    expect(r.candidates.map((c) => c.field)).toEqual(["frames[0]", "frames[1]"]);
    expect(r.candidates[0]!.frames.map((f) => f.role)).toEqual(["execution"]);
    expect(r.candidates[1]!.frames.map((f) => f.role)).toEqual(["self_verify"]);
    expect(r.candidates[0]).toMatchObject({ original: "self_verify/VERIFY", mutated: null });
  });

  it("skips a single-frame seed with a reason", () => {
    const one = parseScenario({
      id: "seed-one",
      title: "seed",
      frames: [{ role: "self_verify", mode: "VERIFY", target: "sender", limits: { execution: 30000 } }],
    });
    const r = frameRemove.generate(one, ctx);
    expect(r.candidates).toEqual([]);
    expect(r.skipped[0]!.reason).toMatch(/empty/);
  });

  it("leaves the parent untouched and is deterministic", () => {
    const before = JSON.stringify(selfVerify);
    expect(frameRemove.generate(selfVerify, ctx)).toEqual(frameRemove.generate(selfVerify, ctx));
    expect(JSON.stringify(selfVerify)).toBe(before);
  });

  it("gives the policy something to judge: removing the approver leaves no payer", () => {
    const c = frameRemove.generate(selfVerify, ctx).candidates[0]!;
    const p = predict({ ...selfVerify, frames: c.frames });
    expect(p.verdict).toBe("reject");
    expect(p.violated).toContain("PREFIX-010");
  });

  it("builds valid scenarios", () => {
    const ledger = new Ledger([selfVerify]);
    const built = frameRemove
      .generate(selfVerify, ctx)
      .candidates.map((c) => buildMutant(selfVerify, frameRemove.id, c, ctx, ledger));
    expect(built.every((b) => b.ok)).toBe(true);
  });
});

describe("frame-duplicate operator", () => {
  it("inserts a copy right after each frame", () => {
    const r = frameDuplicate.generate(selfVerify, ctx);
    expect(r.candidates.map((c) => c.field)).toEqual(["frames[1]", "frames[2]"]);
    expect(r.candidates[0]!.frames.map((f) => f.role)).toEqual(["self_verify", "self_verify", "execution"]);
    expect(r.candidates[1]!.frames.map((f) => f.role)).toEqual(["self_verify", "execution", "execution"]);
    expect(r.candidates[0]).toMatchObject({ original: null, mutated: "self_verify/VERIFY" });
  });

  it("copies are independent objects", () => {
    const frames = frameDuplicate.generate(selfVerify, ctx).candidates[0]!.frames;
    frames[0]!.limits.execution = 1;
    expect(frames[1]!.limits.execution).toBe(30000);
    expect(selfVerify.frames[0]!.limits.execution).toBe(30000);
  });

  it("skips expiry_verify, which the compiler cannot map", () => {
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
    const r = frameDuplicate.generate(seed, ctx);
    expect(r.candidates).toHaveLength(1);
    expect(r.skipped).toHaveLength(1);
    expect(r.skipped[0]!.reason).toMatch(/expiry_verify/);
  });

  it("gives the policy something to judge: a second self_verify after the prefix", () => {
    const c = frameDuplicate.generate(selfVerify, ctx).candidates[0]!;
    const p = predict({ ...selfVerify, frames: c.frames });
    expect(p.verdict).toBe("reject");
    expect(p.violated).toContain("PREFIX-050");
  });

  it("lets the schema reject a 64-frame seed instead of hardcoding the limit here", () => {
    const frames = [
      { role: "self_verify", mode: "VERIFY", target: "sender", limits: { execution: 30000 } },
      ...Array.from({ length: 63 }, () => ({
        role: "execution",
        mode: "SENDER",
        target: RECIPIENT,
        limits: { execution: 1000 },
      })),
    ];
    const full = parseScenario({ id: "seed-full", title: "seed", frames });
    expect(full.frames).toHaveLength(64);
    const c = frameDuplicate.generate(full, ctx).candidates[0]!;
    const r = buildMutant(full, frameDuplicate.id, c, ctx, new Ledger([full]));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toMatch(/schema validation failed/);
  });
});
