import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { parseScenario, type Scenario } from "@adversyn/core";

export const PACKAGE = "@adversyn/scenarios";

export interface LoadedScenario {
  file: string;
  scenario: Scenario;
}

export function loadScenarioFile(file: string): Scenario {
  const raw = fs.readFileSync(file, "utf8");
  let data: unknown;
  try {
    data = parse(raw);
  } catch (e) {
    throw new Error(`${file}: invalid YAML: ${e instanceof Error ? e.message : String(e)}`);
  }
  try {
    return parseScenario(data);
  } catch (e) {
    throw new Error(`${file}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export function loadScenarioDir(dir: string): LoadedScenario[] {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .sort();
  const seen = new Map<string, string>();
  const out: LoadedScenario[] = [];
  for (const f of files) {
    const file = path.join(dir, f);
    const scenario = loadScenarioFile(file);
    const prior = seen.get(scenario.id);
    if (prior) throw new Error(`duplicate scenario id "${scenario.id}" in ${file} and ${prior}`);
    seen.set(scenario.id, file);
    out.push({ file, scenario });
  }
  return out;
}
