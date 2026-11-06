import { FrameRole } from "@adversyn/core";
import { approveScopeFor, UNCOMPILABLE_ROLES } from "@adversyn/protocol";
import type { Candidate, MutationOperator, Skip } from "./types.js";

export const ROLE_ID = "role";

export const roleMutation: MutationOperator = {
  id: ROLE_ID,
  description:
    "Change a frame's role to another role, but only when that changes the compiled transaction (the approve scope of a VERIFY frame).",
  generate(seed) {
    const candidates: Candidate[] = [];
    const skipped: Skip[] = [];

    seed.frames.forEach((frame, index) => {
      const field = `frames[${index}].role`;

      if (frame.role && UNCOMPILABLE_ROLES.has(frame.role)) {
        skipped.push({
          operator: ROLE_ID,
          field,
          reason: `role ${frame.role} cannot be compiled yet`,
        });
        return;
      }

      const scopeBefore = approveScopeFor(frame);
      const labelOnly: string[] = [];

      for (const role of FrameRole.options) {
        if (role === frame.role) continue;
        if (UNCOMPILABLE_ROLES.has(role)) {
          skipped.push({
            operator: ROLE_ID,
            field,
            reason: `target role ${role} cannot be compiled yet`,
          });
          continue;
        }
        if (approveScopeFor({ ...frame, role }) === scopeBefore) {
          labelOnly.push(role);
          continue;
        }
        const frames = seed.frames.map((f) => structuredClone(f));
        const edited = frames[index];
        if (edited) edited.role = role;
        candidates.push({ field, original: frame.role ?? null, mutated: role, frames });
      }

      if (labelOnly.length > 0) {
        skipped.push({
          operator: ROLE_ID,
          field,
          reason:
            `label-only for ${frame.mode} frames (${labelOnly.join(", ")}): the compiled transaction is identical, ` +
            "so a node cannot tell these apart and the policy's prediction would not be testable",
        });
      }
    });

    return { candidates, skipped };
  },
};
