import {
  makeFingerprint,
  scenarioHash,
  type Finding,
  type FindingClass,
  type Observation,
  type ReportEntry,
  type Scenario,
} from "@adversyn/core";
import type { Prediction } from "@adversyn/policy";
import { classifyObservation } from "./classify.js";

type Sev = Finding["severity"];
type Status = Finding["status"];

export function compare(scenario: Scenario, prediction: Prediction, obs: Observation): ReportEntry {
  const o = classifyObservation(obs);
  const predicted = { verdict: prediction.verdict, ruleIds: prediction.violated };
  const observed = { verdict: o.verdict, ruleIds: o.ruleIds, stage: o.stage };
  const hash = scenarioHash(scenario);
  const base = { scenarioId: scenario.id, title: scenario.title, predicted, observed };

  const finding = (cls: FindingClass, status: Status, severity: Sev, title: string, notes: string[]): Finding => ({
    schemaVersion: 1,
    fingerprint: makeFingerprint({
      class: cls,
      policy: prediction.policy,
      scenarioHash: hash,
      expected: predicted,
      observed: { verdict: observed.verdict, ruleIds: observed.ruleIds },
    }),
    class: cls,
    status,
    severity,
    title,
    policy: prediction.policy,
    scenarioId: scenario.id,
    scenarioHash: hash,
    runId: obs.runId,
    expected: predicted,
    observed: { verdict: observed.verdict, ruleIds: observed.ruleIds },
    evidence: { notes: [...notes, ...o.texts.map((t) => "node said: " + t)], observation: obs },
    detectedAt: new Date().toISOString(),
  });

  if (o.stage === "error") {
    return { ...base, result: "error", notes: ["submission failed before a verdict: " + (o.texts[0] ?? "unknown error")] };
  }

  if (o.stage === "validation") {
    return {
      ...base,
      result: "inconclusive",
      notes: [
        "node ran validation code and it failed; the policy has no oracle for validation-code behaviour (signatures, contract logic)",
        ...o.texts.map((t) => "node said: " + t),
      ],
    };
  }

  if (prediction.verdict === "accept") {
    if (o.verdict === "accept") {
      const notes =
        o.stage === "solvency"
          ? ["node stopped at the solvency check, so static rules passed; later rules (opcodes, storage, ...) were not exercised"]
          : [];
      return { ...base, result: "pass", notes };
    }
    if (o.ruleIds.length > 0) {
      const f = finding("conformance", "violation", "medium",
        "Node rejected a transaction the policy accepts (" + o.ruleIds.join(", ") + ")", []);
      return { ...base, result: "finding", notes: [f.title], finding: f };
    }
    const f = finding("no-oracle", "anomaly", "low", "Node rejected a transaction for an unrecognised reason", []);
    return { ...base, result: "finding", notes: [f.title], finding: f };
  }

  if (o.verdict === "accept") {
    const admitted = o.stage === "admitted";
    const f = finding("conformance", "violation", admitted ? "high" : "medium",
      (admitted ? "Node admitted" : "Node's static checks passed") +
        " a transaction the policy rejects (" + prediction.violated.join(", ") + ")",
      admitted ? [] : ["node stopped at solvency; this rule was not enforced before it"]);
    return { ...base, result: "finding", notes: [f.title], finding: f };
  }
  if (o.ruleIds.length === 0) {
    return { ...base, result: "inconclusive", notes: ["both reject, but the reason text is not recognised; verdict agrees, rule attribution unknown", ...o.texts.map((t) => "node said: " + t)] };
  }
  if (o.ruleIds.every((id) => prediction.violated.includes(id))) {
    return { ...base, result: "pass", notes: [] };
  }
  const f = finding("conformance", "anomaly", "medium",
    "Rejected for " + o.ruleIds.join(", ") + " but the policy predicts " + prediction.violated.join(", "), []);
  return { ...base, result: "finding", notes: [f.title], finding: f };
}
