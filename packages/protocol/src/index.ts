import { getProfile } from "@forshtat/hegota-support/profiles";
import * as lib from "@forshtat/hegota-support/tx";
import { toWire } from "@forshtat/hegota-support/rpc";
import type { Hex } from "viem";
import type { Frame, Scenario } from "@adversyn/core";

export const PACKAGE = "@adversyn/protocol";
export const DEFAULT_PROFILE = "ethrex-eip8141-tracer";

export class UnsupportedScenarioError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedScenarioError";
  }
}

const APPROVE_SCOPE: Record<string, string> = {
  self_verify: "EXECUTION_AND_PAYMENT",
  only_verify: "EXECUTION",
  pay: "PAYMENT",
};

const UNSUPPORTED_ROLES = new Set(["expiry_verify"]);

export interface CompileOptions {
  chainId: number;
  sender: Hex;
  nonce: bigint;
  privateKey: Hex;
  profileName?: string;
  maxFeePerGas?: bigint;
}

export interface Compiled {
  wire: unknown;
  hash: Hex;
}

type Profile = ReturnType<typeof getProfile>;

function buildFrame(profile: Profile, f: Frame, index: number) {
  if (f.role && UNSUPPORTED_ROLES.has(f.role)) {
    throw new UnsupportedScenarioError(`frame ${index}: role ${f.role} needs verifier/factory details not mapped yet`);
  }
  const value = BigInt(f.value);
  const opts = {
    target: f.target === "sender" ? null : (f.target as Hex),
    execution: BigInt(f.limits.execution),
    state: f.limits.state !== undefined ? BigInt(f.limits.state) : undefined,
    value: value > 0n ? value : undefined,
    data: f.data === "0x" ? undefined : (f.data as Hex),
    flags: f.atomicBatch ? profile.flagBits["ATOMIC_BATCH"] : undefined,
    scope: f.mode === "VERIFY" ? ((f.role && APPROVE_SCOPE[f.role]) ?? "EXECUTION_AND_PAYMENT") : undefined,
  };
  return lib.frame(profile, f.mode, opts);
}

export async function compileScenario(s: Scenario, o: CompileOptions): Promise<Compiled> {
  if (s.signature !== "valid") {
    throw new UnsupportedScenarioError(`signature "${s.signature}" is not supported yet`);
  }
  if (s.sender !== "generated") {
    throw new UnsupportedScenarioError("explicit sender addresses cannot be signed for");
  }
  if (s.nonce.keys.length !== 1 || s.nonce.keys[0] !== "0") {
    throw new UnsupportedScenarioError("keyed nonces (EIP-8250) are not supported yet");
  }

  const profile = getProfile(o.profileName ?? DEFAULT_PROFILE);
  const frames = s.frames.map((f, i) => buildFrame(profile, f, i));
  const nonceSeq = s.nonce.seq !== "0" ? BigInt(s.nonce.seq) : o.nonce;
  const maxFeePerGas = s.fees ? BigInt(s.fees.maxFeePerGas) : (o.maxFeePerGas ?? 2_000_000_000n);

  const tx = lib.newTx({
    chainId: o.chainId,
    sender: o.sender,
    nonceSeq,
    frames,
    signatures: [lib.secp256k1Placeholder(profile, "0x")],
    fees: { maxFeePerGas },
  });
  const signed = await lib.signTx(profile, tx, o.privateKey);
  return { wire: toWire(signed), hash: lib.txHash(profile, signed) };
}
