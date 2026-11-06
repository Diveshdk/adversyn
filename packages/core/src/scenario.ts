import { z } from "zod";
import { Address, Hex, SCHEMA_VERSION } from "./primitives.js";
import { hashCanonical } from "./canonical.js";

export const FrameMode = z.enum(["VERIFY", "DEFAULT", "SENDER"]);
export type FrameMode = z.infer<typeof FrameMode>;

export const FrameRole = z.enum([
  "self_verify",
  "only_verify",
  "pay",
  "expiry_verify",
  "deploy",
  "pre_verify",
  "execution",
]);
export type FrameRole = z.infer<typeof FrameRole>;

export const Frame = z.object({
  role: FrameRole.optional(),
  mode: FrameMode,
  target: z.union([Address, z.literal("sender")]),
  limits: z.object({
    execution: z.number().int().nonnegative(),
    state: z.number().int().nonnegative().optional(),
  }),
  value: z.string().regex(/^\d+$/).default("0"),
  data: Hex.default("0x"),
  atomicBatch: z.boolean().default(false),
  extra: z.record(z.string(), z.unknown()).optional(),
});
export type Frame = z.infer<typeof Frame>;

export const StakeState = z.object({
  sender: z.boolean().default(false),
  payer: z.boolean().default(false),
  factory: z.boolean().default(false),
});

export const Expectation = z.object({
  verdict: z.enum(["accept", "reject"]),
  ruleIds: z.array(z.string()).default([]),
});

// Provenance of a generated (mutated) scenario: facts about how it was made, never about how it behaves.
export const Provenance = z.object({
  parentId: z.string().min(1),
  parentContentHash: z.string().min(1),
  operator: z.string().min(1),
  field: z.string().min(1),
  original: z.unknown(),
  mutated: z.unknown(),
  policy: z.string().min(1),
  generation: z.record(z.string(), z.unknown()),
});
export type Provenance = z.infer<typeof Provenance>;

export const Scenario = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
  id: z.string().regex(/^[a-z0-9][a-z0-9._-]*$/, "use lowercase, digits, . _ -"),
  title: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  exercises: z.array(z.string()).default([]),
  seed: z.number().int().default(0),
  sender: z.union([Address, z.literal("generated")]).default("generated"),
  nonce: z
    .object({
      keys: z.array(z.string().regex(/^\d+$/)).default(["0"]),
      seq: z.string().regex(/^\d+$/).default("0"),
    })
    .default({ keys: ["0"], seq: "0" }),
  fees: z
    .object({
      maxFeePerGas: z.string().regex(/^\d+$/),
      maxPriorityFeePerGas: z.string().regex(/^\d+$/),
    })
    .optional(),
  signature: z.enum(["valid", "invalid", "none"]).default("valid"),
  stake: StakeState.default({ sender: false, payer: false, factory: false }),
  frames: z.array(Frame).min(1).max(64),
  expect: Expectation.optional(),
  provenance: Provenance.optional(),
});
export type Scenario = z.infer<typeof Scenario>;

export function parseScenario(input: unknown): Scenario {
  return Scenario.parse(input);
}

export function scenarioHash(s: Scenario): string {
  const { description, title, tags, provenance, ...semantic } = s;
  void description;
  void title;
  void tags;
  void provenance;
  return hashCanonical(semantic);
}

// Hash of exactly what is compiled and sent: ignores id, titles, tags, expectation and provenance.
export function scenarioContentHash(s: Scenario): string {
  return hashCanonical({
    sender: s.sender,
    nonce: s.nonce,
    fees: s.fees,
    signature: s.signature,
    stake: s.stake,
    frames: s.frames,
  });
}
