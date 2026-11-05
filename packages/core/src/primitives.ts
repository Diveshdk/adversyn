import { z } from "zod";

export const Hex = z.string().regex(/^0x[0-9a-fA-F]*$/, "expected 0x-prefixed hex");
export const Address = z.string().regex(/^0x[0-9a-fA-F]{40}$/, "expected 20-byte hex address");
export const Hash32 = z.string().regex(/^0x[0-9a-fA-F]{64}$/, "expected 32-byte hex hash");

export const Verdict = z.enum(["accept", "reject", "unknown"]);
export type Verdict = z.infer<typeof Verdict>;

export const SCHEMA_VERSION = 1 as const;
