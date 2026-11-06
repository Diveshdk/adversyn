import { privateKeyToAccount } from "viem/accounts";
import { policyRefString, type Scenario } from "@adversyn/core";
import { compileScenario } from "@adversyn/protocol";
import { ERC8421_STATIC_POLICY, SECP256K1_VERIFY_COST_OBSERVED, predict } from "@adversyn/policy";
import { buildMutant, Ledger } from "./build.js";
import { OPERATORS, operatorIds } from "./registry.js";
import type { MutationOperator, Skip } from "./types.js";

// Used only to check that a mutant compiles. Never submitted anywhere.
const VALIDATION_KEY = ("0x" + "22".repeat(32)) as `0x${string}`;
const VALIDATION_SENDER = privateKeyToAccount(VALIDATION_KEY).address;

export interface GenerateOptions {
  /** Unix seconds used by time-dependent policy rules. Required so output is reproducible. */
  nowSec: number;
  /** Operator ids to run; default all. */
  operators?: string[];
  /** Maximum number of generated scenarios in total. */
  max?: number;
  /** Other scenarios whose ids and content must not be collided with (the seeds are always included). */
  existing?: Scenario[];
}

export interface SkippedMutation extends Skip {
  seed: string;
}

/** A prediction from the policy. It is not an observation. */
export interface CasePrediction {
  policy: string;
  verdict: "accept" | "reject";
  violated: string[];
  unevaluated: string[];
}

export interface GeneratedCase {
  scenario: Scenario;
  prediction: CasePrediction;
}

export interface GenerationResult {
  context: {
    policy: string;
    nowSec: number;
    /** Measured on a live node, not defined by the specification. */
    sigVerifyCostObserved: number;
    operators: string[];
    max: number | null;
  };
  cases: GeneratedCase[];
  skipped: SkippedMutation[];
  /** Candidates not evaluated because max was reached. */
  truncated: number;
}

function selectOperators(ids: string[] | undefined): MutationOperator[] {
  if (!ids) return [...OPERATORS];
  const known = new Map(OPERATORS.map((o) => [o.id, o]));
  const picked: MutationOperator[] = [];
  for (const id of ids) {
    const op = known.get(id);
    if (!op) throw new Error(`unknown operator "${id}"; known operators: ${operatorIds().join(", ")}`);
    if (!picked.includes(op)) picked.push(op);
  }
  // Keep registry order regardless of the order the ids were given in.
  return OPERATORS.filter((o) => picked.includes(o));
}

export async function generateMutants(seeds: Scenario[], opts: GenerateOptions): Promise<GenerationResult> {
  if (opts.max !== undefined && (!Number.isInteger(opts.max) || opts.max < 0)) {
    throw new Error("max must be a non-negative integer");
  }
  const operators = selectOperators(opts.operators);
  const policy = policyRefString(ERC8421_STATIC_POLICY);
  const ledger = new Ledger([...seeds, ...(opts.existing ?? [])]);

  const cases: GeneratedCase[] = [];
  const skipped: SkippedMutation[] = [];
  let truncated = 0;

  for (const seed of seeds) {
    for (const op of operators) {
      const result = op.generate(seed, { policy });
      for (const s of result.skipped) skipped.push({ ...s, seed: seed.id });

      for (const candidate of result.candidates) {
        if (opts.max !== undefined && cases.length >= opts.max) {
          truncated++;
          continue;
        }
        const built = buildMutant(seed, op.id, candidate, { policy }, ledger);
        if (!built.ok) {
          skipped.push({ operator: op.id, field: candidate.field, reason: built.reason, seed: seed.id });
          continue;
        }
        try {
          await compileScenario(built.scenario, {
            chainId: 1337,
            sender: VALIDATION_SENDER,
            nonce: 0n,
            privateKey: VALIDATION_KEY,
          });
        } catch (e) {
          skipped.push({
            operator: op.id,
            field: candidate.field,
            reason: "the compiler cannot build this scenario: " + (e instanceof Error ? e.message : String(e)),
            seed: seed.id,
          });
          continue;
        }
        const p = predict(built.scenario, { nowSec: opts.nowSec });
        cases.push({
          scenario: built.scenario,
          prediction: { policy, verdict: p.verdict, violated: p.violated, unevaluated: p.unevaluated },
        });
      }
    }
  }

  return {
    context: {
      policy,
      nowSec: opts.nowSec,
      sigVerifyCostObserved: SECP256K1_VERIFY_COST_OBSERVED,
      operators: operators.map((o) => o.id),
      max: opts.max ?? null,
    },
    cases,
    skipped,
    truncated,
  };
}
