import { parseScenario, scenarioContentHash, type Scenario } from "@adversyn/core";
import type { Candidate, OperatorContext } from "./types.js";

export const GENERATOR = { tool: "adversyn-mutate", version: 1 } as const;

/** Tracks IDs and content hashes already in use so generated scenarios never collide. */
export class Ledger {
  readonly ids: Set<string>;
  readonly hashes = new Set<string>();

  constructor(existing: Scenario[] = []) {
    this.ids = new Set(existing.map((s) => s.id));
    for (const s of existing) this.hashes.add(scenarioContentHash(s));
  }
}

export type BuildResult =
  | { ok: true; scenario: Scenario }
  | { ok: false; reason: string };

export function buildMutant(
  seed: Scenario,
  operatorId: string,
  c: Candidate,
  ctx: OperatorContext,
  ledger: Ledger,
): BuildResult {
  const scenario: Scenario = structuredClone(seed);
  scenario.frames = structuredClone(c.frames);
  delete scenario.expect;

  const hash = scenarioContentHash(scenario);
  if (hash === scenarioContentHash(seed)) return { ok: false, reason: "no-op: identical to the parent" };
  if (ledger.hashes.has(hash)) return { ok: false, reason: "duplicate content already generated or present" };

  let id: string | undefined;
  for (const len of [8, 12, 16, 24, 64]) {
    const candidate = `${seed.id}.${operatorId}.${hash.slice(0, len)}`;
    if (!ledger.ids.has(candidate)) {
      id = candidate;
      break;
    }
  }
  if (!id) return { ok: false, reason: "could not find an unused id" };

  scenario.id = id;
  scenario.title = `${seed.title} [${operatorId}]`;
  scenario.tags = [...seed.tags, "mutant", `op:${operatorId}`];
  scenario.provenance = {
    parentId: seed.id,
    parentContentHash: scenarioContentHash(seed),
    operator: operatorId,
    field: c.field,
    original: c.original,
    mutated: c.mutated,
    policy: ctx.policy,
    generation: { ...GENERATOR },
  };

  let valid: Scenario;
  try {
    valid = parseScenario(scenario);
  } catch (e) {
    return { ok: false, reason: "schema validation failed: " + (e instanceof Error ? e.message : String(e)) };
  }
  ledger.ids.add(id);
  ledger.hashes.add(hash);
  return { ok: true, scenario: valid };
}
