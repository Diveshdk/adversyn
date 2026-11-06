import { describe, it, expect } from "vitest";
import { parseScenario } from "@adversyn/core";
import { predict } from "@adversyn/policy";
import { frameOrder, buildMutant, Ledger } from "@adversyn/mutation";

const ctx = { policy: "erc-8421-static:erc-8421@74a868cd" };
const PAYER = "0x2222222222222222222222222222222222222222";
const RECIPIENT = "0x8943545177806ED17B9F23F0a21ee5948eCaa776";

const sponsored = parseScenario({
  id: "seed-sponsored",
  title: "seed",
  frames: [
    { role: "only_verify", mode: "VERIFY", target: "sender", limits: { execution: 30000 } },
    { role: "pay", mode: "VERIFY", target: PAYER, limits: { execution: 50000 } },
    { role: "execution", mode: "SENDER", target: RECIPIENT, limits: { execution: 50000 } },
  ],
});

const selfVerify = parseScenario({
  id: "seed-self",
  title: "seed",
  frames: [
    { role: "self_verify", mode: "VERIFY", target: "sender", limits: { execution: 30000 } },
    { role: "execution", mode: "SENDER", target: RECIPIENT, limits: { execution: 50000 } },
  ],
});

describe("frame-order operator", () => {
  it("emits one swap per adjacent pair, in order", () => {
    const r = frameOrder.generate(sponsored, ctx);
    expect(r.skipped).toEqual([]);
    expect(r.candidates.map((c) => c.field)).toEqual(["frames[0..1].order", "frames[1..2].order"]);
    expect(r.candidates[0]!.frames.map((f) => f.role)).toEqual(["pay", "only_verify", "execution"]);
    expect(r.candidates[1]!.frames.map((f) => f.role)).toEqual(["only_verify", "execution", "pay"]);
  });

  it("records the original and mutated order", () => {
    const c = frameOrder.generate(sponsored, ctx).candidates[0]!;
    expect(c.original).toEqual(["only_verify/VERIFY", "pay/VERIFY"]);
    expect(c.mutated).toEqual(["pay/VERIFY", "only_verify/VERIFY"]);
  });

  it("is deterministic and leaves the parent untouched", () => {
    const before = JSON.stringify(sponsored);
    expect(frameOrder.generate(sponsored, ctx)).toEqual(frameOrder.generate(sponsored, ctx));
    expect(JSON.stringify(sponsored)).toBe(before);
  });

  it("skips a single-frame seed with a reason", () => {
    const one = parseScenario({
      id: "seed-one",
      title: "seed",
      frames: [{ role: "self_verify", mode: "VERIFY", target: "sender", limits: { execution: 30000 } }],
    });
    const r = frameOrder.generate(one, ctx);
    expect(r.candidates).toEqual([]);
    expect(r.skipped[0]!.reason).toMatch(/at least two frames/);
  });

  it("skips swaps involving expiry_verify, which the compiler cannot map", () => {
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
        { role: "execution", mode: "SENDER", target: RECIPIENT, limits: { execution: 50000 } },
      ],
    });
    const r = frameOrder.generate(seed, ctx);
    expect(r.candidates.map((c) => c.field)).toEqual(["frames[1..2].order"]);
    expect(r.skipped).toHaveLength(1);
    expect(r.skipped[0]!.field).toBe("frames[0..1].order");
    expect(r.skipped[0]!.reason).toMatch(/expiry_verify/);
  });

  it("builds valid scenarios, and a swap of identical frames becomes a no-op skip", () => {
    const twin = parseScenario({
      id: "seed-twin",
      title: "seed",
      frames: [
        { role: "self_verify", mode: "VERIFY", target: "sender", limits: { execution: 30000 } },
        { role: "execution", mode: "SENDER", target: RECIPIENT, limits: { execution: 50000 } },
        { role: "execution", mode: "SENDER", target: RECIPIENT, limits: { execution: 50000 } },
      ],
    });
    const ledger = new Ledger([twin]);
    const built = frameOrder
      .generate(twin, ctx)
      .candidates.map((c) => buildMutant(twin, frameOrder.id, c, ctx, ledger));
    expect(built.filter((b) => b.ok)).toHaveLength(1);
    const skipped = built.find((b) => !b.ok);
    expect(skipped && !skipped.ok && skipped.reason).toMatch(/no-op/);
  });

  it("gives the policy something to judge: moving the approver behind a body frame breaks the prefix shape", () => {
    const swapped = frameOrder.generate(selfVerify, ctx).candidates[0]!;
    const p = predict({ ...selfVerify, frames: swapped.frames });
    expect(p.verdict).toBe("reject");
    expect(p.violated).toContain("PREFIX-010");
  });
});
