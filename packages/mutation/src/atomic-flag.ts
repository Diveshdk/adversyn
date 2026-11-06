import { UNCOMPILABLE_ROLES } from "@adversyn/protocol";
import type { Candidate, MutationOperator, Skip } from "./types.js";

export const ATOMIC_FLAG_ID = "atomic-flag";

export const atomicFlag: MutationOperator = {
  id: ATOMIC_FLAG_ID,
  description: "Toggle the atomic batch flag on one frame at a time.",
  generate(seed) {
    const candidates: Candidate[] = [];
    const skipped: Skip[] = [];

    seed.frames.forEach((frame, index) => {
      const field = `frames[${index}].atomicBatch`;
      if (frame.role && UNCOMPILABLE_ROLES.has(frame.role)) {
        skipped.push({
          operator: ATOMIC_FLAG_ID,
          field,
          reason: `role ${frame.role} cannot be compiled yet`,
        });
        return;
      }
      const frames = seed.frames.map((f) => structuredClone(f));
      const edited = frames[index];
      if (!edited) return;
      edited.atomicBatch = !frame.atomicBatch;
      candidates.push({
        field,
        original: frame.atomicBatch,
        mutated: edited.atomicBatch,
        frames,
      });
    });

    return { candidates, skipped };
  },
};
