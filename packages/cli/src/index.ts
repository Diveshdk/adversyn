import path from "node:path";
import { Command } from "commander";
import { policyRefString, type ReportEntry } from "@adversyn/core";
import { loadScenarioDir } from "@adversyn/scenarios";
import { predict } from "@adversyn/policy";
import { compare } from "@adversyn/analyzer";
import { runScenario, SidecarTarget } from "@adversyn/executor";
import { summarize, writeReport } from "@adversyn/reporter";
import { generateMutants, writeOutput } from "@adversyn/mutation";
import type { Hex } from "viem";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const program = new Command("adversyn").description(
  "Adversarial testing for EIP-8141 frame transactions and alt mempools",
);

program
  .command("run")
  .argument("[dir]", "scenario directory", "scenarios/examples")
  .option("--rpc <url>", "sidecar RPC URL", "https://altmempoolgateway.forshtat.com/rpc")
  .option("--chain-id <n>", "chain id", "1337")
  .option("--profile <name>", "hegota-support profile", "ethrex-eip8141-tracer")
  .option("--only <ids>", "comma-separated scenario ids")
  .option("--delay <ms>", "pause between submissions", "300")
  .option("--out <dir>", "report output directory")
  .option("--fail-on-finding", "exit 1 if any finding is produced")
  .action(async (dir: string, o: Record<string, string | boolean | undefined>) => {
    const only = typeof o.only === "string" ? new Set(o.only.split(",")) : undefined;
    const loaded = loadScenarioDir(path.resolve(dir)).filter((l) => !only || only.has(l.scenario.id));
    const target = new SidecarTarget({
      name: "sidecar",
      rpcUrl: String(o.rpc),
      chainId: Number(o.chainId),
      profile: String(o.profile),
    });
    const key = process.env["ADVERSYN_PRIVATE_KEY"] as Hex | undefined;
    const runId = "run-" + new Date().toISOString().replace(/[:.]/g, "-");
    const delay = Number(o.delay);

    console.log(`target ${target.cfg.rpcUrl} (chain ${target.cfg.chainId}), ${loaded.length} scenarios`);
    console.log(key ? "sender: funded key from ADVERSYN_PRIVATE_KEY" : "sender: fresh throwaway key per scenario");

    const entries: ReportEntry[] = [];
    let policyRef = "";
    for (const { scenario } of loaded) {
      const prediction = predict(scenario);
      policyRef = policyRefString(prediction.policy);
      const predicted = { verdict: prediction.verdict, ruleIds: prediction.violated };
      const res = await runScenario(target, scenario, { runId, privateKey: key });
      let entry: ReportEntry;
      if (res.kind === "skipped") {
        entry = {
          scenarioId: scenario.id,
          title: scenario.title,
          result: "inconclusive",
          predicted,
          observed: { verdict: "unknown", ruleIds: [], stage: "skipped" },
          notes: ["skipped: " + res.reason],
        };
      } else {
        entry = compare(scenario, prediction, res.observation);
        await sleep(delay);
      }
      entries.push(entry);
      console.log(`${entry.result.toUpperCase().padEnd(12)} ${scenario.id}  [${entry.observed.stage}]`);
      for (const n of entry.notes) console.log("             " + n);
    }

    const s = summarize(entries);
    console.log(`\n${s.total} scenarios: ${s.pass} pass, ${s.finding} findings, ${s.inconclusive} inconclusive/skipped, ${s.error} errors`);
    const outDir = path.resolve(typeof o.out === "string" ? o.out : `out/${runId}`);
    const files = writeReport(outDir, entries, {
      policy: policyRef,
      target: target.cfg.rpcUrl,
      generatedAt: new Date().toISOString(),
    });
    console.log("wrote:\n  " + files.join("\n  "));
    if (o["failOnFinding"] && s.finding > 0) process.exitCode = 1;
  });

program
  .command("mutate")
  .description("Generate deterministic mutated scenarios from seed scenarios (offline; nothing is sent to a node)")
  .argument("[dir]", "seed scenario directory", "scenarios/examples")
  .option("--only <ids>", "comma-separated seed scenario ids")
  .option("--operators <ids>", "comma-separated operator ids (default: all)")
  .option("--max <n>", "maximum number of generated scenarios")
  .option("--now <unixSec>", "time for time-dependent policy rules (default: current time, recorded in the manifest)")
  .option("--out <dir>", "output directory", "out/mutants")
  .option("--overwrite", "overwrite files from a previous run in --out")
  .action(async (dir: string, o: Record<string, string | boolean | undefined>) => {
    const fail = (msg: string) => {
      console.error("error: " + msg);
      process.exitCode = 1;
    };
    const all = loadScenarioDir(path.resolve(dir)).map((l) => l.scenario);
    const only = typeof o.only === "string" ? o.only.split(",").map((x) => x.trim()).filter(Boolean) : undefined;
    if (only) {
      const missing = only.filter((id) => !all.some((s) => s.id === id));
      if (missing.length) return fail("unknown seed scenario id(s): " + missing.join(", "));
    }
    const seeds = only ? all.filter((s) => only.includes(s.id)) : all;

    const max = typeof o.max === "string" ? Number(o.max) : undefined;
    if (max !== undefined && (!Number.isInteger(max) || max < 0)) return fail("--max must be a non-negative integer");
    const nowSec = typeof o.now === "string" ? Number(o.now) : Math.floor(Date.now() / 1000);
    if (!Number.isInteger(nowSec) || nowSec < 0) return fail("--now must be a unix time in seconds");
    const operators =
      typeof o.operators === "string" ? o.operators.split(",").map((x) => x.trim()).filter(Boolean) : undefined;

    let result;
    try {
      result = await generateMutants(seeds, { nowSec, max, operators, existing: all });
    } catch (e) {
      return fail(e instanceof Error ? e.message : String(e));
    }

    const outDir = path.resolve(typeof o.out === "string" ? o.out : "out/mutants");
    let written;
    try {
      written = writeOutput(outDir, result, seeds.map((s) => s.id), { overwrite: o.overwrite === true });
    } catch (e) {
      return fail(e instanceof Error ? e.message : String(e));
    }

    const perOp = new Map<string, number>();
    for (const c of result.cases) {
      const op = c.scenario.provenance?.operator ?? "?";
      perOp.set(op, (perOp.get(op) ?? 0) + 1);
    }
    console.log(
      `${seeds.length} seed scenario(s), operators: ${result.context.operators.join(", ")}, now=${nowSec}`,
    );
    console.log(`generated ${result.cases.length}, skipped ${result.skipped.length}, truncated ${result.truncated}`);
    for (const [op, n] of perOp) console.log(`  ${op}: ${n}`);
    const shown = result.skipped.slice(0, 15);
    if (shown.length) console.log("skipped (first " + shown.length + "):");
    for (const s of shown) console.log(`  ${s.seed} / ${s.operator} / ${s.field ?? "-"}: ${s.reason}`);
    if (result.skipped.length > shown.length) {
      console.log(`  ... ${result.skipped.length - shown.length} more in the manifest`);
    }
    console.log("These are offline policy predictions, not observations. Nothing was sent to a node.");
    console.log("wrote: " + written.manifestFile);
    console.log("run them with: pnpm adversyn run " + path.join(outDir, "scenarios"));
  });

program.parseAsync();
