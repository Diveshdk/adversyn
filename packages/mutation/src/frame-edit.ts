import type { Frame } from "@adversyn/core";
import type { Candidate, MutationOperator, Skip } from "./types.js";

export const FRAME_REMOVE_ID = "frame-remove";
export const FRAME_DUPLICATE_ID = "frame-duplicate";

// Roles the protocol compiler cannot map yet (see compileScenario in @adversyn/protocol).
const UNCOMPILABLE_ROLES = new Set(["expiry_verify"]);

const label = (f: Frame) => `${f.role ?? "(none)"}/${f.mode}`;
const copy = (frames: Frame[]) => frames.map((f) => structuredClone(f));

export const frameRemove: MutationOperator = {
  id: FRAME_REMOVE_ID,
  description: "Remove one frame at a time.",
  generate(seed) {
    const candidates: Candidate[] = [];
    const skipped: Skip[] = [];

    if (seed.frames.length < 2) {
      skipped.push({
        operator: FRAME_REMOVE_ID,
        reason: "removing the only frame would leave an empty transaction",
      });
      return { candidates, skipped };
    }

    seed.frames.forEach((f, i) => {
      const frames = copy(seed.frames);
      frames.splice(i, 1);
      candidates.push({
        field: `frames[${i}]`,
        original: label(f),
        mutated: null,
        frames,
      });
    });
    return { candidates, skipped };
  },
};

export const frameDuplicate: MutationOperator = {
  id: FRAME_DUPLICATE_ID,
  description: "Insert a copy of one frame immediately after itself.",
  generate(seed) {
    const candidates: Candidate[] = [];
    const skipped: Skip[] = [];

    seed.frames.forEach((f, i) => {
      const field = `frames[${i + 1}]`;
      if (f.role && UNCOMPILABLE_ROLES.has(f.role)) {
        skipped.push({
          operator: FRAME_DUPLICATE_ID,
          field,
          reason: `role ${f.role} cannot be compiled yet, so a copy of it could not be sent`,
        });
        return;
      }
      const frames = copy(seed.frames);
      frames.splice(i + 1, 0, structuredClone(f));
      candidates.push({
        field,
        original: null,
        mutated: label(f),
        frames,
      });
    });
    return { candidates, skipped };
  },
};
