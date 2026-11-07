// Real repository files, imported at build time so the site never drifts from what is committed.
import validSelfVerify from "@repo/scenarios/examples/01-valid-self-verify.yaml?raw";
import invalidAtomic from "@repo/scenarios/examples/06-invalid-atomic-in-prefix.yaml?raw";
import invalidVerifyAfter from "@repo/scenarios/examples/07-invalid-verify-after-prefix.yaml?raw";
import boundary97201 from "@repo/scenarios/examples/14-boundary-budget-97201.yaml?raw";
import leadDeploy from "@repo/scenarios/examples/lead-deploy-not-deploying-sender.yaml?raw";
import onlyVerifyPay from "@repo/scenarios/examples/02-valid-only-verify-pay.yaml?raw";
import mutantLast from "@repo/scenarios/generated/scenarios/valid-self-verify.atomic-flag.8f8946c4.yaml?raw";
import mutantFirst from "@repo/scenarios/generated/scenarios/valid-self-verify.atomic-flag.9172d677.yaml?raw";
import mutantGas from "@repo/scenarios/generated/scenarios/valid-self-verify.gas-boundary.9a97a593.yaml?raw";
import run3Report from "@repo/docs/evidence/mutants/mutant-run-3/report.md?raw";
import run3Findings from "@repo/docs/evidence/mutants/mutant-run-3/findings.json?raw";
import run2cResults from "@repo/docs/evidence/mutants/mutant-run-2c/results.json?raw";
import validResults from "@repo/docs/evidence/valid-self-verify/results.json?raw";
import sampleReport from "@repo/docs/sample-report.md?raw";
import manifestRaw from "@repo/scenarios/generated/manifest.json?raw";

export const FILES = {
  validSelfVerify,
  invalidAtomic,
  invalidVerifyAfter,
  boundary97201,
  leadDeploy,
  onlyVerifyPay,
  mutantLast,
  mutantFirst,
  mutantGas,
  run3Report,
  sampleReport,
};

export const PATHS = {
  validSelfVerify: "scenarios/examples/01-valid-self-verify.yaml",
  invalidAtomic: "scenarios/examples/06-invalid-atomic-in-prefix.yaml",
  invalidVerifyAfter: "scenarios/examples/07-invalid-verify-after-prefix.yaml",
  boundary97201: "scenarios/examples/14-boundary-budget-97201.yaml",
  leadDeploy: "scenarios/examples/lead-deploy-not-deploying-sender.yaml",
  onlyVerifyPay: "scenarios/examples/02-valid-only-verify-pay.yaml",
  mutantLast: "scenarios/generated/scenarios/valid-self-verify.atomic-flag.8f8946c4.yaml",
  mutantFirst: "scenarios/generated/scenarios/valid-self-verify.atomic-flag.9172d677.yaml",
  mutantGas: "scenarios/generated/scenarios/valid-self-verify.gas-boundary.9a97a593.yaml",
  run3: "docs/evidence/mutants/mutant-run-3",
  run2c: "docs/evidence/mutants/mutant-run-2c",
  valid: "docs/evidence/valid-self-verify",
  sampleReport: "docs/sample-report.md",
  manifest: "scenarios/generated/manifest.json",
};

/** Provenance block of a generated scenario, as committed. */
export const provenanceOf = (yaml: string) => yaml.slice(yaml.indexOf("provenance:")).trimEnd();

/** Frames block of a generated scenario. */
export const framesOf = (yaml: string) => yaml.slice(yaml.indexOf("frames:"), yaml.indexOf("provenance:")).trimEnd();

type Json = Record<string, unknown>;

const run3 = (JSON.parse(run3Findings) as Json[])[0]!;
const run3Obs = (run3["evidence"] as Json)["observation"] as Json;

/** The recorded finding with the bulky observation summarised. */
export const FINDING_SUMMARY = JSON.stringify(
  {
    ...run3,
    evidence: {
      notes: (run3["evidence"] as Json)["notes"],
      observation: {
        runId: run3Obs["runId"],
        scenarioHash: run3Obs["scenarioHash"],
        target: run3Obs["target"],
        startedAt: run3Obs["startedAt"],
        submit: run3Obs["submit"],
        raw: "{ request: <signed wire transaction>, response: <node reply> }",
      },
    },
  },
  null,
  2,
);

/** The full observation from the recorded finding, including the signed wire request. */
export const OBSERVATION_FULL = JSON.stringify(run3Obs, null, 2);

export const RESULT_2C = JSON.stringify(JSON.parse(run2cResults), null, 2);
export const RESULT_VALID = JSON.stringify(JSON.parse(validResults), null, 2);

const manifest = JSON.parse(manifestRaw) as Json;
const firstCase = (manifest["cases"] as Json[]).find((c) => c["id"] === "valid-self-verify.atomic-flag.9172d677")!;

/** Manifest header + one case, as committed. */
export const MANIFEST_EXCERPT = JSON.stringify(
  {
    manifestVersion: manifest["manifestVersion"],
    notice: manifest["notice"],
    context: manifest["context"],
    seeds: manifest["seeds"],
    counts: manifest["counts"],
    cases: [firstCase, "…"],
  },
  null,
  2,
);

/** A real prediction from the committed manifest (atomic flag on frame 0). */
export const PREDICTION_EXAMPLE = JSON.stringify(firstCase["prediction"], null, 2);

/** The signed wire request as recorded in the observation (mutant-run-3). */
export const WIRE_REQUEST = JSON.stringify((run3Obs["raw"] as Json)["request"], null, 2);

export interface ManifestCase {
  id: string;
  file: string;
  provenance: { parentId: string; operator: string; field: string; original: unknown; mutated: unknown };
  prediction: { verdict: string; violated: string[] };
}
/** Every committed generated case, in manifest order. */
export const MANIFEST_CASES = manifest["cases"] as unknown as ManifestCase[];
