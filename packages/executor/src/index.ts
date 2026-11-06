import { RpcError, rpc } from "@forshtat/hegota-support/rpc";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";
import { scenarioHash, type Observation, type Scenario, type SubmitResult } from "@adversyn/core";
import { compileScenario, UnsupportedScenarioError } from "@adversyn/protocol";

export const PACKAGE = "@adversyn/executor";

export interface TargetConfig {
  name: string;
  rpcUrl: string;
  chainId: number;
  profile?: string;
}

export type SubmitReply =
  | { ok: true; result: unknown }
  | { ok: false; code: string; message: string };

export interface Target {
  cfg: TargetConfig;
  submit(wire: unknown): Promise<SubmitReply>;
  getNonce(address: string): Promise<bigint>;
}

export class SidecarTarget implements Target {
  constructor(readonly cfg: TargetConfig) {}

  async submit(wire: unknown): Promise<SubmitReply> {
    try {
      const result = await rpc(this.cfg.rpcUrl, "eth_sendFrameTransaction", [wire]);
      return { ok: true, result };
    } catch (e) {
      if (e instanceof RpcError) return { ok: false, code: String(e.code), message: e.message };
      return { ok: false, code: "RPC_UNREACHABLE", message: e instanceof Error ? e.message : String(e) };
    }
  }

  async getNonce(address: string): Promise<bigint> {
    return BigInt(await rpc(this.cfg.rpcUrl, "eth_getTransactionCount", [address, "latest"]));
  }
}

export type RunResult =
  | { kind: "observed"; observation: Observation }
  | { kind: "skipped"; reason: string };

export interface RunOptions {
  runId: string;
  privateKey?: Hex;
}

function toSubmitResult(reply: SubmitReply, hash: Hex): SubmitResult {
  const rpcMethod = "eth_sendFrameTransaction";
  if (reply.ok) {
    return { outcome: "admitted", txHash: typeof reply.result === "string" ? reply.result : hash, rpcMethod, reasons: [] };
  }
  const infra = /UNREACHABLE|BAD_RESPONSE/.test(reply.code);
  const num = /-?\d+/.exec(reply.code)?.[0];
  return {
    outcome: infra ? "error" : "rejected",
    rpcMethod,
    errorCode: num !== undefined ? Number(num) : undefined,
    errorMessage: reply.message,
    reasons: [{ text: reply.message, source: "rpc-error" }],
  };
}

export async function runScenario(target: Target, s: Scenario, opts: RunOptions): Promise<RunResult> {
  if (s.stake.sender || s.stake.payer || s.stake.factory) {
    return { kind: "skipped", reason: "needs staked entities; staking is not arranged by Adversyn" };
  }
  if (s.tags.includes("needs-deployed-contract")) {
    return { kind: "skipped", reason: "needs a deployed contract (paymaster, wallet, ...) that Adversyn does not deploy yet" };
  }
  const privateKey = opts.privateKey ?? generatePrivateKey();
  const sender = privateKeyToAccount(privateKey).address;
  const nonce = opts.privateKey ? await target.getNonce(sender) : 0n;

  let compiled;
  try {
    compiled = await compileScenario(s, {
      chainId: target.cfg.chainId,
      sender,
      nonce,
      privateKey,
      profileName: target.cfg.profile,
    });
  } catch (e) {
    if (e instanceof UnsupportedScenarioError) return { kind: "skipped", reason: e.message };
    throw e;
  }

  const startedAt = new Date().toISOString();
  const t0 = performance.now();
  const reply = await target.submit(compiled.wire);
  const durationMs = performance.now() - t0;

  const observation: Observation = {
    schemaVersion: 1,
    runId: opts.runId,
    scenarioId: s.id,
    scenarioHash: scenarioHash(s),
    target: { name: target.cfg.name, rpcUrl: target.cfg.rpcUrl, chainId: target.cfg.chainId },
    startedAt,
    durationMs,
    submit: toSubmitResult(reply, compiled.hash),
    raw: { request: compiled.wire, response: reply },
  };
  return { kind: "observed", observation };
}
