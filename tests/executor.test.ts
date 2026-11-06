import { describe, it, expect } from "vitest";
import path from "node:path";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { loadScenarioDir } from "@adversyn/scenarios";
import { compileScenario, UnsupportedScenarioError } from "@adversyn/protocol";
import { runScenario, type Target, type SubmitReply } from "@adversyn/executor";
import { REAL } from "@adversyn/testkit";

const all = loadScenarioDir(path.resolve(process.cwd(), "scenarios/examples"));
const get = (id: string) => all.find((l) => l.scenario.id === id)!.scenario;

const fake = (reply: SubmitReply): Target => ({
  cfg: { name: "fake", rpcUrl: "fake://", chainId: 1337 },
  submit: async () => reply,
  getNonce: async () => 0n,
});

describe("protocol.compileScenario", () => {
  it("compiles and signs a valid scenario", async () => {
    const key = generatePrivateKey();
    const out = await compileScenario(get("valid-self-verify"), {
      chainId: 1337,
      sender: privateKeyToAccount(key).address,
      nonce: 0n,
      privateKey: key,
    });
    expect(out.hash).toMatch(/^0x[0-9a-f]{64}$/i);
    expect(out.wire).toBeTruthy();
  });

  it("refuses scenarios it cannot map yet", async () => {
    const key = generatePrivateKey();
    await expect(
      compileScenario(get("invalid-expired-expiry"), {
        chainId: 1337,
        sender: privateKeyToAccount(key).address,
        nonce: 0n,
        privateKey: key,
      }),
    ).rejects.toBeInstanceOf(UnsupportedScenarioError);
  });
});

describe("executor.runScenario", () => {
  it("records a rejection as an observation", async () => {
    const r = await runScenario(
      fake({ ok: false, code: "RPC_-32602", message: REAL.verifyAfterPrefix }),
      get("invalid-verify-after-prefix"),
      { runId: "t" },
    );
    expect(r.kind).toBe("observed");
    if (r.kind === "observed") {
      expect(r.observation.submit).toMatchObject({ outcome: "rejected", errorCode: -32602 });
    }
  });

  it("records an admission with the returned hash", async () => {
    const r = await runScenario(fake({ ok: true, result: "0xabc" }), get("valid-self-verify"), { runId: "t" });
    expect(r.kind === "observed" && r.observation.submit.txHash).toBe("0xabc");
  });

  it("treats an unreachable node as an error outcome", async () => {
    const r = await runScenario(
      fake({ ok: false, code: "RPC_UNREACHABLE", message: "down" }),
      get("valid-self-verify"),
      { runId: "t" },
    );
    expect(r.kind === "observed" && r.observation.submit.outcome).toBe("error");
  });

  it("skips scenarios that need stake and ones it cannot compile", async () => {
    const a = await runScenario(fake({ ok: true, result: "0x" }), get("valid-budget-staked"), { runId: "t" });
    const b = await runScenario(fake({ ok: true, result: "0x" }), get("invalid-expired-expiry"), { runId: "t" });
    expect(a.kind).toBe("skipped");
    expect(b.kind).toBe("skipped");
  });
});
