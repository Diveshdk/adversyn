import { createHash } from "node:crypto";

function sortValue(v: unknown): unknown {
  if (v === null) return null;
  switch (typeof v) {
    case "string":
    case "boolean":
      return v;
    case "number":
      if (!Number.isFinite(v)) throw new Error("canonicalize: non-finite number");
      return v;
    case "bigint":
      return v.toString();
    case "undefined":
    case "function":
    case "symbol":
      throw new Error(`canonicalize: unsupported value of type ${typeof v}`);
    case "object": {
      if (Array.isArray(v)) return v.map(sortValue);
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(v as object).sort()) {
        const val = (v as Record<string, unknown>)[key];
        if (val === undefined) continue;
        out[key] = sortValue(val);
      }
      return out;
    }
  }
}

export function canonicalize(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function hashCanonical(value: unknown): string {
  return sha256Hex(canonicalize(value));
}
