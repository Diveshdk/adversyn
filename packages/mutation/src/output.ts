import fs from "node:fs";
import path from "node:path";
import { stringify } from "yaml";
import { scenarioContentHash, type Scenario } from "@adversyn/core";
import type { GenerationResult } from "./engine.js";

export const MANIFEST_VERSION = 1;

export const MANIFEST_NOTICE =
  "Predictions come from the offline policy. None of these scenarios has been sent to a node, " +
  "and no scenario here is a finding or a confirmed vulnerability.";

export function scenarioToYaml(s: Scenario): string {
  return stringify(s, { lineWidth: 0 });
}

const scenarioPath = (id: string) => `scenarios/${id}.yaml`;

export function buildManifest(result: GenerationResult, seedIds: string[]) {
  return {
    manifestVersion: MANIFEST_VERSION,
    notice: MANIFEST_NOTICE,
    context: result.context,
    seeds: seedIds,
    counts: {
      generated: result.cases.length,
      skipped: result.skipped.length,
      truncated: result.truncated,
    },
    cases: result.cases.map((c) => ({
      id: c.scenario.id,
      file: scenarioPath(c.scenario.id),
      contentHash: scenarioContentHash(c.scenario),
      provenance: c.scenario.provenance,
      prediction: c.prediction,
    })),
    skipped: result.skipped,
  };
}

export interface WriteOptions {
  overwrite?: boolean;
}

export function writeOutput(
  outDir: string,
  result: GenerationResult,
  seedIds: string[],
  opts: WriteOptions = {},
): { manifestFile: string; scenarioFiles: string[] } {
  const manifestFile = path.join(outDir, "manifest.json");
  const files = result.cases.map((c) => ({
    file: path.join(outDir, scenarioPath(c.scenario.id)),
    text: scenarioToYaml(c.scenario),
  }));

  if (!opts.overwrite) {
    const clash = [manifestFile, ...files.map((f) => f.file)].find((f) => fs.existsSync(f));
    if (clash) {
      throw new Error(`${clash} already exists; choose a new --out directory or pass --overwrite`);
    }
  }

  fs.mkdirSync(path.join(outDir, "scenarios"), { recursive: true });
  for (const f of files) fs.writeFileSync(f.file, f.text);
  fs.writeFileSync(manifestFile, JSON.stringify(buildManifest(result, seedIds), null, 2) + "\n");
  return { manifestFile, scenarioFiles: files.map((f) => f.file) };
}
