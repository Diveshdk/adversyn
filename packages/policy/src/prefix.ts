import type { Frame, Scenario } from "@adversyn/core";

const APPROVING = new Set(["self_verify", "only_verify", "pay"]);

export interface PrefixInfo {
  hasApprover: boolean;
  frames: Frame[];
  rest: Frame[];
}

export function isApproving(f: Frame | undefined): boolean {
  return f?.role !== undefined && APPROVING.has(f.role);
}

export function analyzePrefix(s: Scenario): PrefixInfo {
  const idx = s.frames.findIndex((f) => f.role === "self_verify" || f.role === "pay");
  if (idx < 0) return { hasApprover: false, frames: [], rest: s.frames };
  return {
    hasApprover: true,
    frames: s.frames.slice(0, idx + 1),
    rest: s.frames.slice(idx + 1),
  };
}

export function stripLeadingExpiry(frames: Frame[]): Frame[] {
  return frames[0]?.role === "expiry_verify" ? frames.slice(1) : frames;
}

export type NormalizedRoles =
  | { ok: true; roles: string[] }
  | { ok: false; why: string };

export function normalizeRoles(frames: Frame[]): NormalizedRoles {
  const roles: string[] = [];
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (!f) continue;
    if (f.role === "pre_verify") {
      if (!isApproving(frames[i + 1])) {
        return { ok: false, why: "pre_verify frame is not immediately followed by an approving frame" };
      }
      continue;
    }
    roles.push(f.role ?? "unknown");
  }
  return { ok: true, roles };
}
