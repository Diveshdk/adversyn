import fs from "node:fs";
import path from "node:path";
import type { ReportEntry } from "@adversyn/core";

export const PACKAGE = "@adversyn/reporter";

export interface ReportMeta {
  policy: string;
  target: string;
  generatedAt: string;
}

export function summarize(entries: ReportEntry[]) {
  const c = { pass: 0, finding: 0, inconclusive: 0, error: 0 };
  for (const e of entries) c[e.result]++;
  return { total: entries.length, ...c };
}

const icon = { pass: "PASS", finding: "FINDING", inconclusive: "INCONCLUSIVE", error: "ERROR" } as const;

export function renderMarkdown(entries: ReportEntry[], meta: ReportMeta): string {
  const s = summarize(entries);
  const lines = [
    "# Adversyn conformance report",
    "",
    "- Target: " + meta.target,
    "- Policy: " + meta.policy,
    "- Generated: " + meta.generatedAt,
    "- Results: " + s.total + " scenarios, " + s.pass + " pass, " + s.finding + " findings, " +
      s.inconclusive + " inconclusive, " + s.error + " errors",
    "",
    "| Scenario | Result | Predicted | Observed | Stage |",
    "|---|---|---|---|---|",
  ];
  const fmt = (v: { verdict: string; ruleIds: string[] }) =>
    v.verdict + (v.ruleIds.length ? " (" + v.ruleIds.join(", ") + ")" : "");
  for (const e of entries) {
    lines.push("| " + e.scenarioId + " | " + icon[e.result] + " | " + fmt(e.predicted) + " | " + fmt(e.observed) + " | " + e.observed.stage + " |");
  }
  const findings = entries.filter((e) => e.finding);
  if (findings.length) {
    lines.push("", "## Findings", "");
    for (const e of findings) {
      const f = e.finding!;
      lines.push("### " + f.title, "", "- Scenario: " + e.scenarioId, "- Class: " + f.class + ", status: " + f.status + ", severity: " + f.severity, "- Fingerprint: `" + f.fingerprint + "`");
      for (const n of f.evidence.notes) lines.push("- " + n);
      lines.push("");
    }
  }
  const other = entries.filter((e) => !e.finding && e.notes.length && e.result !== "pass");
  if (other.length) {
    lines.push("", "## Notes", "");
    for (const e of other) for (const n of e.notes) lines.push("- " + e.scenarioId + ": " + n);
  }
  return lines.join("\n") + "\n";
}

export function writeReport(dir: string, entries: ReportEntry[], meta: ReportMeta): string[] {
  fs.mkdirSync(dir, { recursive: true });
  const files = {
    results: path.join(dir, "results.json"),
    findings: path.join(dir, "findings.json"),
    markdown: path.join(dir, "report.md"),
  };
  fs.writeFileSync(files.results, JSON.stringify({ meta, entries }, null, 2));
  fs.writeFileSync(files.findings, JSON.stringify(entries.flatMap((e) => (e.finding ? [e.finding] : [])), null, 2));
  fs.writeFileSync(files.markdown, renderMarkdown(entries, meta));
  return Object.values(files);
}
