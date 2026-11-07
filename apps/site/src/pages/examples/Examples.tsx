import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { TerminalBlock } from "../../components/TerminalBlock";
import { CodeBlock } from "../../components/CodeBlock";
import { H2 } from "../../components/DocsLayout";
import { T } from "../../components/DocBits";
import { Badge, Callout } from "../../components/Chrome";
import { TX_A, TX_GAS_MUTANT, explorerTx, repoFile, repoTree, short } from "../../content/facts";
import { FILES, PATHS, FINDING_SUMMARY, MANIFEST_CASES, RESULT_VALID } from "../../content/repoFiles";
import * as S from "../../content/sessions";

const EXAMPLES = [
  {
    to: "/examples/baseline",
    t: "Baseline test",
    d: "Submit the simplest valid Frame Transaction and confirm the sidecar admits it. What a clean PASS looks like, unfunded and funded.",
    src: "docs/evidence/valid-self-verify",
  },
  {
    to: "/examples/adversarial",
    t: "Adversarial test",
    d: "Mutate the baseline, predict each variant, send three of them to the node, and account for every outcome, including the one that surprised the policy.",
    src: "docs/evidence/mutants",
  },
  {
    to: "/examples/evidence",
    t: "Evidence report",
    d: "A real finding read field by field: what the fingerprint covers, where the node's words are, and how it was resolved.",
    src: "docs/evidence/mutants/mutant-run-3",
  },
];

export function ExamplesIndex() {
  useEffect(() => {
    document.title = "Examples · Adversyn";
  }, []);
  return (
    <main id="main">
      <header className="page-head">
        <div className="container">
          <p className="eyebrow">Examples</p>
          <h1>Real runs, end to end.</h1>
          <p className="lede">
            Each example is built from files committed in the repository and recorded against the public ERC-8421 devnet (chain 1337) on
            2026-11-06. Dates matter: the devnet has changed since.
          </p>
        </div>
      </header>
      <section className="section section--tight">
        <div className="container">
          <ol className="ex-list">
            {EXAMPLES.map((e, i) => (
              <li className="ex-item" key={e.to}>
                <Link to={e.to}>
                  <span className="ex-n">0{i + 1}</span>
                  <div>
                    <h2>{e.t}</h2>
                    <p>{e.d}</p>
                  </div>
                  <span className="mono">{e.src}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}

function ExampleShell({ n, title, lede, children }: { n: string; title: string; lede: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} · Adversyn Examples`;
  }, [title]);
  const i = EXAMPLES.findIndex((e) => e.t === title);
  const next = EXAMPLES[i + 1];
  return (
    <main id="main" className="container">
      <div className="ex-layout">
        <Link to="/examples" className="ex-back">
          ← All examples
        </Link>
        <article className="prose doc-article" style={{ marginTop: 20 }}>
          <header className="doc-head">
            <p className="eyebrow">Example {n}</p>
            <h1 style={{ marginTop: 10 }}>{title}</h1>
            <p className="doc-lede">{lede}</p>
          </header>
          {children}
        </article>
        <nav className="pager" aria-label="Next example">
          <Link to="/docs/quickstart" className="pager-link">
            <span className="pager-dir">Try it</span>
            <span className="pager-title">Quickstart</span>
          </Link>
          {next ? (
            <Link to={next.to} className="pager-link pager-next">
              <span className="pager-dir">Next example →</span>
              <span className="pager-title">{next.t}</span>
            </Link>
          ) : (
            <Link to="/docs/findings" className="pager-link pager-next">
              <span className="pager-dir">Reference →</span>
              <span className="pager-title">Findings & reports</span>
            </Link>
          )}
        </nav>
      </div>
    </main>
  );
}

export function ExampleBaseline() {
  return (
    <ExampleShell n="01" title="Baseline test" lede="Establish that the target admits a transaction the policy considers valid, before attacking anything.">
      <dl className="kv">
        <div>
          <dt>Scenario</dt>
          <dd>valid-self-verify</dd>
        </div>
        <div>
          <dt>Predicted</dt>
          <dd>accept</dd>
        </div>
        <div>
          <dt>Observed</dt>
          <dd>admitted</dd>
        </div>
        <div>
          <dt>Result</dt>
          <dd>
            <Badge kind="pass">PASS</Badge>
          </dd>
        </div>
      </dl>

      <H2>The scenario</H2>
      <p>
        One <code>self_verify</code> frame in <code>VERIFY</code> mode that approves both execution and payment, followed by a{" "}
        <code>SENDER</code> frame that transfers 1 gwei. This is the simplest allowed prefix shape, <code>[self_verify]</code>.
      </p>
      <CodeBlock code={FILES.validSelfVerify} lang="yaml" filename={PATHS.validSelfVerify} href={repoFile(PATHS.validSelfVerify)} />

      <H2>Unfunded run</H2>
      <p>With the default throwaway key the node checks the structural rules and then stops at solvency:</p>
      <TerminalBlock
        session={`$ pnpm adversyn run --only valid-self-verify
target https://altmempoolgateway.forshtat.com/rpc (chain 1337), 1 scenarios
sender: fresh throwaway key per scenario
PASS         valid-self-verify  [solvency]
             node stopped at the solvency check, so static rules passed; later rules (opcodes, storage, ...) were not exercised

1 scenarios: 1 pass, 0 findings, 0 inconclusive/skipped, 0 errors`}
        title="unfunded"
        caption="Result line and note as recorded for valid-self-verify on 2026-11-06 03:58 UTC (docs/evidence/budget-drift/fifth)."
      />
      <p>This is a PASS for the structural rules only. Anything the node checks after solvency was not exercised, and the note says so.</p>

      <H2>Funded run</H2>
      <p>With a funded throwaway devnet key the transaction goes all the way through admission:</p>
      <TerminalBlock session={S.RUN_BASELINE_FUNDED} title="funded" caption={<>Reconstructed from <code>docs/evidence/valid-self-verify/results.json</code>, 2026-11-06 14:50 UTC.</>} />
      <CodeBlock code={RESULT_VALID} lang="json" filename="docs/evidence/valid-self-verify/results.json" href={repoFile("docs/evidence/valid-self-verify/results.json")} />
      <p>
        The explorer shows the transaction{" "}
        <a href={explorerTx(TX_A)} target="_blank" rel="noreferrer" className="mono">
          {short(TX_A)}
        </a>{" "}
        with an admission report in which every rule passed (gas-limit, recent-root, prefix, structure, signature, simulation,
        trace-alignment, OP-061, execution, mempool), status “New”, nonce 2.{" "}
        <a href={repoFile("docs/evidence/explorer-valid-self-verify.png")} target="_blank" rel="noreferrer">
          Screenshot
        </a>
        .
      </p>
      <Callout kind="info" title="What this does and does not show">
        Admitted means accepted into the pool. This transaction was still pending when captured; admission is not inclusion. An earlier
        admission of the same scenario that day was not hashed and is not claimed.
      </Callout>
    </ExampleShell>
  );
}

export function ExampleAdversarial() {
  const vsv = MANIFEST_CASES.filter((c) => c.provenance.parentId === "valid-self-verify");
  return (
    <ExampleShell n="02" title="Adversarial test" lede="Turn one admitted baseline into eleven controlled variants, then check three of them against the live node.">
      <H2>Generate</H2>
      <p>
        Running every operator over <code>valid-self-verify</code> produced the variants below (committed in{" "}
        <code>scenarios/generated/</code>, generated with <code>--now 1800000000</code>). Each has a policy prediction; none has been
        observed yet at this point.
      </p>
      <T
        head={["Mutant", "Change", "Predicted"]}
        wrap
        rows={vsv.map((c) => [
          <code>{c.id.replace("valid-self-verify.", "")}</code>,
          <code>
            {c.provenance.field}: {c.provenance.original === null ? "(absent)" : JSON.stringify(c.provenance.original)} →{" "}
            {c.provenance.mutated === null ? "(absent)" : JSON.stringify(c.provenance.mutated)}
          </code>,
          c.prediction.verdict + (c.prediction.violated.length ? ` (${c.prediction.violated.join(", ")})` : ""),
        ])}
      />

      <H2>Execute three</H2>
      <p>Three mutants were sent to the node on 2026-11-06, with a funded key for the first and third.</p>
      <T
        head={["Mutant", "Predicted", "Observed", "Result"]}
        wrap
        rows={[
          [<code>gas-boundary.9a97a593</code>, "reject (BUDGET-010)", <>admitted, <a href={explorerTx(TX_GAS_MUTANT)} target="_blank" rel="noreferrer" className="mono">{short(TX_GAS_MUTANT)}</a></>, <Badge kind="finding">FINDING → explained</Badge>],
          [<code>atomic-flag.9172d677</code>, "reject (PREFIX-040)", "reject (PREFIX-040), static", <Badge kind="pass">PASS</Badge>],
          [<code>atomic-flag.8f8946c4</code>, "accept", "reject, stage other", <Badge kind="finding">FINDING → policy gap</Badge>],
        ]}
      />

      <H2>Matched: atomic flag in the prefix</H2>
      <TerminalBlock session={S.RUN_MUTANT_PREFIX} title="mutant-run-2c" caption={<>Recorded 15:34 UTC. <a href={repoTree(PATHS.run2c)} target="_blank" rel="noreferrer">docs/evidence/mutants/mutant-run-2c</a></>} />
      <p>The node rejected for exactly the rule the policy predicted, before solvency, and said so in its own words.</p>

      <H2>Surprised the policy: atomic flag on the last frame</H2>
      <CodeBlock code={FILES.mutantLast.slice(FILES.mutantLast.indexOf("frames:"), FILES.mutantLast.indexOf("provenance:")).trimEnd()} lang="yaml" filename="valid-self-verify.atomic-flag.8f8946c4.yaml · frames" href={repoFile(PATHS.mutantLast)} />
      <TerminalBlock session={S.RUN_MUTANT_LAST} title="mutant-run-3" caption={<>Recorded 15:36 UTC with a funded key. <a href={repoTree(PATHS.run3)} target="_blank" rel="noreferrer">docs/evidence/mutants/mutant-run-3</a></>} />
      <p>
        The policy only knows PREFIX-040 (no flag on prefix frames), so it predicted accept. The node said{" "}
        <code>Frame 1: atomic batch flag on last frame</code>. No pattern matched, so the analyzer produced a low-severity{" "}
        <code>no-oracle</code> finding instead of guessing a rule.
      </p>
      <p>
        Reading EIP-8141: the atomic batch flag requires a subsequent non-VERIFY frame to batch with, so the last frame may not carry it. The
        node was right. The gap is in Adversyn's policy, which encodes ERC-8421 only. Documented follow-up: add the EIP-8141 atomic-batch
        constraints as an explicit rule and regenerate the manifest.
      </p>

      <H2>Explained by the environment: the gas boundary</H2>
      <p>
        <code>gas-boundary.9a97a593</code> sets frame 0 to 97,201 gas, one over the boundary measured that morning. It was admitted. The
        devnet maintainer had restarted the devnet without gas limits earlier that day, which also explains why unfunded probes at much
        higher values stopped at solvency. Not a vulnerability; preserved as dated before/after evidence in{" "}
        <a href={repoFile("docs/evidence/budget-drift/README.md")} target="_blank" rel="noreferrer">
          docs/evidence/budget-drift
        </a>
        .
      </p>
      <Callout kind="note" title="The point">
        Of the three runs, none revealed a node bug. One confirmed enforcement, one exposed a gap in the tool's own expectations,
        and one recorded an environment change. Adversyn's job is to make each of those distinguishable.
      </Callout>
    </ExampleShell>
  );
}

export function ExampleEvidence() {
  return (
    <ExampleShell n="03" title="Evidence report" lede="What a finding contains, why each field is there, and how this one was resolved.">
      <H2>The report</H2>
      <CodeBlock code={FILES.run3Report} lang="md" filename="docs/evidence/mutants/mutant-run-3/report.md" href={repoFile("docs/evidence/mutants/mutant-run-3/report.md")} />

      <H2>The finding</H2>
      <CodeBlock code={FINDING_SUMMARY} lang="json" filename="findings.json" href={repoFile("docs/evidence/mutants/mutant-run-3/findings.json")} caption="The raw request/response is summarised here; it is complete in the file." />

      <H2>Field by field</H2>
      <T
        head={["Field", "Value here", "Why it matters"]}
        wrap
        rows={[
          [<code>fingerprint</code>, <code>337d6f48…1469d</code>, "Same policy, scenario and verdicts → same fingerprint. Deduplicate across runs and machines."],
          [<code>class / status / severity</code>, "no-oracle / anomaly / low", "The node refused for a reason the analyzer cannot attribute. Low because refusing is the safe direction."],
          [<code>policy</code>, <code>erc-8421@74a868cd</code>, "The finding is relative to this rule set, not to “the spec” in general."],
          [<code>scenarioHash</code>, <code>787ff5e5…</code>, "Identifies exactly what was compiled, independent of titles and tags."],
          [<code>expected / observed</code>, "accept / reject", "Prediction and observation side by side, never merged."],
          [<code>evidence.notes</code>, <code>node said: Frame 1: …</code>, "The node's own words, verbatim."],
          [<code>evidence.observation</code>, "submit + raw", "Error code -32500, timing, target, and the full signed request, so anyone can re-examine it."],
        ]}
      />

      <H2>Resolution</H2>
      <ol>
        <li>Read the node's wording and find the matching constraint in EIP-8141 (Frame Transaction, Constraints).</li>
        <li>Conclude the node is consistent with EIP-8141, and that the policy lacks that constraint.</li>
        <li>Record the gap in <code>docs/LIMITATIONS.md</code> and the evidence README, with the run folder.</li>
        <li>Do not call it a vulnerability. Nothing here is one.</li>
      </ol>
      <Callout kind="info" title="Reproduce">
        Run <code>pnpm adversyn run scenarios/generated/scenarios --only valid-self-verify.atomic-flag.8f8946c4</code> with a funded
        throwaway devnet key. It has not been tried with an unfunded key. A new run produces a new run id and timestamps but, for the same
        verdicts, the same fingerprint.
      </Callout>
    </ExampleShell>
  );
}
