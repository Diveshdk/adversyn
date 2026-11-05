import { z } from "zod";
import { Finding } from "./finding.js";
import { Verdict } from "./primitives.js";

export const ReportEntry = z.object({
  scenarioId: z.string(),
  title: z.string(),
  result: z.enum(["pass", "finding", "inconclusive", "error"]),
  predicted: z.object({ verdict: Verdict, ruleIds: z.array(z.string()) }),
  observed: z.object({ verdict: Verdict, ruleIds: z.array(z.string()), stage: z.string() }),
  notes: z.array(z.string()),
  finding: Finding.optional(),
});
export type ReportEntry = z.infer<typeof ReportEntry>;
