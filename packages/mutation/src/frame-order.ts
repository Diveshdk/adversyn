import type { Frame } from "@adversyn/core";
import type { Candidate, MutationOperator, Skip } from "./types.js";

export const FRAME_ORDER_ID = "frame-order";

// Roles the protocol compiler cannot map yet (see compileScenario in @adversyn/protocol).
const UNCOMPILABLE_ROLES = new Set(["expiry_verify"]);

const label = (f: Frame) => `${f.role ?? "(none)"}/${f.mode}`;

export const frameOrder: MutationOperator = {
  id: FRAME_ORDER_ID,
  description: "Swap each pair of adjacent frames.",
  generate(seed) {
    const candidates: Candidate[] = [];
    const skipped: Skip[] = [];

    if (seed.frames.length < 2) {
      skipped.push({
        operator: FRAME_ORDER_ID,
        reason: "needs at least two frames to reorder",
      });
      return { candidates, skipped };
    }

    for (let i = 0; i + 1 < seed.frames.length; i++) {
      const a = seed.frames[i];
      const b = seed.frames[i + 1];
      if (!a || !b) continue;
      const field = `frames[${i}..${i + 1}].order`;

      const blocked = [a, b].find((f) => f.role && UNCOMPILABLE_ROLES.has(f.role));
      if (blocked) {
        skipped.push({
          operator: FRAME_ORDER_ID,
          field,
          reason: `role ${blocked.role} cannot be compiled yet, so a swap involving it could not be sent`,
        });
        continue;
      }

      const frames = seed.frames.map((f) => structuredClone(f));
      frames[i] = structuredClone(b);
      frames[i + 1] = structuredClone(a);
      candidates.push({
        field,
        original: [label(a), label(b)],
        mutated: [label(b), label(a)],
        frames,
      });
    }

    return { candidates, skipped };
  },
};
