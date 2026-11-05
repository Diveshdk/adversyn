import { z } from "zod";
import { SCHEMA_VERSION } from "./primitives.js";

export const TargetInfo = z.object({
  name: z.string().min(1),
  rpcUrl: z.string().min(1),
  chainId: z.number().int().optional(),
});
export type TargetInfo = z.infer<typeof TargetInfo>;

export const Reason = z.object({
  ruleId: z.string().optional(),
  text: z.string(),
  source: z.enum(["rpc-error", "explorer", "simulation", "other"]),
});
export type Reason = z.infer<typeof Reason>;

export const SubmitResult = z.object({
  outcome: z.enum(["admitted", "rejected", "error"]),
  txHash: z.string().optional(),
  rpcMethod: z.string(),
  errorCode: z.number().int().optional(),
  errorMessage: z.string().optional(),
  reasons: z.array(Reason).default([]),
});
export type SubmitResult = z.infer<typeof SubmitResult>;

export const Observation = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
  runId: z.string().min(1),
  scenarioId: z.string().min(1),
  scenarioHash: z.string().min(1),
  target: TargetInfo,
  startedAt: z.string(),
  durationMs: z.number().nonnegative(),
  submit: SubmitResult,
  simulation: z
    .object({
      available: z.boolean(),
      trace: z.unknown().optional(),
    })
    .optional(),
  receipt: z.unknown().optional(),
  raw: z.object({
    request: z.unknown(),
    response: z.unknown(),
  }),
});
export type Observation = z.infer<typeof Observation>;
