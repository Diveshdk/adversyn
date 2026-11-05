import { z } from "zod";

export const SpecPin = z.object({
  spec: z.string().min(1),
  commit: z.string().min(1),
});
export type SpecPin = z.infer<typeof SpecPin>;

export const PolicyRef = z.object({
  id: z.string().min(1),
  pins: z.array(SpecPin).min(1),
});
export type PolicyRef = z.infer<typeof PolicyRef>;

export function policyRefString(ref: PolicyRef): string {
  return `${ref.id}:` + ref.pins.map((p) => `${p.spec}@${p.commit}`).join("+");
}
