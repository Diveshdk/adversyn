import path from "node:path";
import { Command } from "commander";
import { policyRefString, type ReportEntry } from "@adversyn/core";
import { loadScenarioDir } from "@adversyn/scenarios";
import { predict } from "@adversyn/policy";
import { compare } from "@adversyn/analyzer";
import { runScenario, SidecarTarget } from "@adversyn/executor";
import { summarize, writeReport } from "@adversyn/reporter";
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

program.parseAsync();
