import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLink, Badge, GitHubIcon, LogoMark, SectionHead } from "../components/Chrome";
import { TerminalBlock } from "../components/TerminalBlock";
import { CodeBlock } from "../components/CodeBlock";
import { Workflow } from "../components/Workflow";
import { Architecture } from "../components/Architecture";
import { REPO_URL, RULES, UNEVALUATED, SPEC_PIN, repoFile, repoTree } from "../content/facts";
import { FILES, PATHS, provenanceOf, FINDING_SUMMARY } from "../content/repoFiles";
import * as S from "../content/sessions";

function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div>
          <h1 className="hero-brand">
            <LogoMark size={64} />
            <span>Adversyn</span>
          </h1>
          <p className="eyebrow hero-eyebrow">Ethereum infrastructure · Adversarial testing</p>
          <p className="hero-title">Know how your mempool behaves before attackers find out.</p>
          <p className="hero-sub">
            Adversyn turns protocol requirements into executable adversarial tests. Simulate Frame Transaction admission, attack
            validation boundaries, observe real alternative mempool behaviour, and produce reproducible evidence.
          </p>
          <div className="hero-ctas">
            <Link to="/docs" className="btn btn-primary">
              Explore Documentation <span className="arrow">→</span>
            </Link>
            <Link to="/how-it-works" className="btn btn-secondary">
              View How It Works
            </Link>
          </div>
          <div className="hero-meta">
            <span>
              <i /> EIP-8141 Frame Transactions
            </span>
            <span>
              <i /> ERC-8421 policy, pinned {SPEC_PIN}
            </span>
            <span>
              <i /> Open source · TypeScript
            </span>
          </div>
        </div>
        <TerminalBlock
          animate
          wrap
          title="adversyn — zsh"
          session={S.RUN_MUTANT_PREFIX.split("\nwrote:")[0]!.replace(" --only ", " \\\n    --only ")}
          footer={
            <div className="term-result">
              <p className="term-result-title">RESULT</p>
              <dl>
                <dt>Mutation</dt>
                <dd>atomic-flag · frames[0].atomicBatch false → true</dd>
                <dt>Predicted</dt>
                <dd>reject · PREFIX-040</dd>
                <dt>Observed</dt>
                <dd>reject · PREFIX-040 · static stage</dd>
                <dt>Result</dt>
                <dd className="ok">PASS — node matches the pinned policy</dd>
                <dt>Evidence</dt>
                <dd>results.json · findings.json · report.md</dd>
              </dl>
            </div>
          }
          caption={
            <>
              Recorded against the public ERC-8421 devnet on 2026-11-06, 15:34 UTC.{" "}
              <a href={repoTree(PATHS.run2c)} target="_blank" rel="noreferrer">
                docs/evidence/mutants/mutant-run-2c
              </a>
            </>
          }
        />
      </div>
    </section>
  );
}

function Problem() {
  const items = [
    {
      t: "Admission uncertainty",
      d: "Does the implementation enforce the rules it is expected to enforce? Unit tests prove the code you wrote runs; they rarely prove the node rejects what the specification forbids.",
      q: "frame 0 in validation prefix has ATOMIC_BATCH_FLAG set",
    },
    {
      t: "Boundary conditions",
      d: "What happens one unit either side of a validation or resource limit? On the morning of 2026-11-06 the devnet put the effective verification-gas boundary for an unstaked sender at 97,200, not 100,000, because signature verification counts too.",
      q: "gas sum 100001 + signature-verification cost 2800 = 102801 exceeds MAX_VERIFY_GAS 100000",
    },
    {
      t: "Implementation divergence",
      d: "Does actual behaviour match the selected protocol requirements and policy? Draft specs move, devnets restart, and different revisions disagree. Divergence has to be observed, dated and explained.",
      q: "Frame 1: atomic batch flag on last frame",
    },
  ];
  return (
    <section className="section section--alt" aria-labelledby="problem-title">
      <div className="container problem">
        <div className="problem-intro">
          <p className="eyebrow">The problem</p>
          <h2 className="section-title" id="problem-title" style={{ marginTop: 16 }}>
            Passing tests doesn't mean passing adversarial conditions.
          </h2>
          <p>
            Conventional testing focuses on expected transaction flows. An alternative mempool must also handle malformed
            inputs, resource boundaries, ordering constraints, authorization scopes and combinations nobody wrote a test for.
          </p>
          <p>
            With EIP-8141, transactions carry their own validation logic, and ERC-8421 mempools decide which of those to admit. A
            node that drifts from the rules either rejects valid traffic or admits what it should not.
          </p>
        </div>
        <div>
          <ol className="problem-list">
            {items.map((it, i) => (
              <li className="problem-item" key={it.t}>
                <span className="problem-num">0{i + 1}</span>
                <h3>{it.t}</h3>
                <p>{it.d}</p>
                <p className="q" aria-label="Real node response">
                  “{it.q}”
                </p>
              </li>
            ))}
          </ol>
          <p className="problem-close">Adversyn makes those behaviours testable.</p>
        </div>
      </div>
    </section>
  );
}

function HowSection() {
  return (
    <section className="section" id="how" aria-labelledby="how-title">
      <div className="container">
        <SectionHead
          eyebrow="How Adversyn works"
          id="how-title"
          title="From protocol requirements to reproducible evidence."
          lede="Every scenario passes through the same six stages. Each stage produces a concrete artifact you can inspect, diff and commit."
        />
        <Workflow />
        <div style={{ marginTop: 48 }}>
          <ArrowLink to="/how-it-works">Read the full pipeline walkthrough</ArrowLink>
        </div>
      </div>
    </section>
  );
}

function RuleTable() {
  return (
    <div className="rule-table">
      <div className="rule-table-head">
        <span>@adversyn/policy · evaluated rules</span>
        <span>{SPEC_PIN}</span>
      </div>
      {RULES.map((r) => (
        <div className="rule-row" key={r.id}>
          <span className="rule-id">{r.id}</span>
          <span className="rule-sum">{r.summary}</span>
          {r.id === "BUDGET-010" ? (
            <Badge kind="inconclusive">limit removed on devnet</Badge>
          ) : r.nodeText ? (
            <Badge kind="pass">observed enforced</Badge>
          ) : (
            <Badge kind="neutral">{r.stage === "time" ? "time-based" : "needs simulation"}</Badge>
          )}
        </div>
      ))}
      <div className="rule-unevaluated">
        Listed as <strong>unevaluated</strong> on every prediction: <span className="mono">{UNEVALUATED.slice(5).join(", ")}</span> and{" "}
        {UNEVALUATED.length - 8} more.
      </div>
    </div>
  );
}

function Capabilities() {
  return (
    <section className="section section--alt" aria-labelledby="caps-title">
      <div className="container">
        <SectionHead
          eyebrow="Capabilities"
          id="caps-title"
          title="Purpose-built for the edge cases that matter."
          lede="Everything below exists in the repository today and is covered by 131 offline tests. Where a capability stops, it says so."
        />
        <div className="caps">
          <div className="cap">
            <div className="cap-text">
              <p className="eyebrow">Protocol policy evaluation</p>
              <h3>A versioned rule set, not a hard-coded opinion.</h3>
              <p>
                <code>predict()</code> evaluates each scenario against seven structural ERC-8421 rules, keyed by their spec IDs and
                pinned to a spec commit. What it does not model, it lists explicitly.
              </p>
              <dl className="cap-facts">
                <div>
                  <dt>Why</dt>
                  <dd>You need a written expectation before you can say a node diverged from it.</dd>
                </div>
                <div>
                  <dt>You get</dt>
                  <dd>A Prediction: verdict, violated rule IDs, and the unevaluated rules.</dd>
                </div>
              </dl>
            </div>
            <div className="cap-visual">
              <RuleTable />
            </div>
          </div>

          <div className="cap cap--flip">
            <div className="cap-text">
              <p className="eyebrow">Frame Transaction compilation</p>
              <h3>Readable scenarios in. Signed wire transactions out.</h3>
              <p>
                Scenarios are YAML. <code>@adversyn/protocol</code> maps them to EIP-8141 frames with{" "}
                <code>@forshtat/hegota-support</code>, sets approve scopes from roles, signs with viem and encodes the wire format.
                Anything it cannot map is skipped with a reason, never approximated.
              </p>
              <dl className="cap-facts">
                <div>
                  <dt>Why</dt>
                  <dd>Hand-building frame transactions for every edge case does not scale and hides intent.</dd>
                </div>
                <div>
                  <dt>You get</dt>
                  <dd>A reviewable test case that states which rule it exercises and what it expects.</dd>
                </div>
              </dl>
            </div>
            <div className="cap-visual">
              <CodeBlock code={FILES.invalidAtomic} lang="yaml" filename={PATHS.invalidAtomic} href={repoFile(PATHS.invalidAtomic)} />
            </div>
          </div>

          <div className="cap">
            <div className="cap-text">
              <p className="eyebrow">Deterministic mutation</p>
              <h3>Controlled variants with a paper trail.</h3>
              <p>
                <code>adversyn mutate</code> applies six operators to seed scenarios offline. Each candidate is compile-checked and
                predicted before it is written. Same inputs, byte-identical output.
              </p>
              <dl className="cap-facts">
                <div>
                  <dt>Why</dt>
                  <dd>Boundaries and orderings are where implementations disagree, and you need to reproduce exactly what you sent.</dd>
                </div>
                <div>
                  <dt>You get</dt>
                  <dd>manifest.json plus one YAML per mutant, each carrying its provenance.</dd>
                </div>
              </dl>
            </div>
            <div className="cap-visual">
              <TerminalBlock session={S.MUTATE_ATOMIC} title="offline · nothing is sent" />
              <CodeBlock code={provenanceOf(FILES.mutantLast)} lang="yaml" filename="valid-self-verify.atomic-flag.8f8946c4.yaml" href={repoFile(PATHS.mutantLast)} />
            </div>
          </div>

          <div className="cap cap--flip">
            <div className="cap-text">
              <p className="eyebrow">Execution & stage-aware analysis</p>
              <h3>Facts from the node. Judgement from the analyzer.</h3>
              <p>
                The executor submits with <code>eth_sendFrameTransaction</code> and records exactly what the node said. The analyzer
                maps that wording to rule IDs using dated patterns and knows how far the node got: an unfunded sender that stops
                at the solvency check proves the structural rules, nothing more.
              </p>
              <dl className="cap-facts">
                <div>
                  <dt>Why</dt>
                  <dd>A false finding costs an infrastructure team more than a missed one. Uncertainty must be explicit.</dd>
                </div>
                <div>
                  <dt>You get</dt>
                  <dd>One of four results per scenario, with the node's own words attached.</dd>
                </div>
              </dl>
            </div>
            <div className="cap-visual">
              <div className="verdicts">
                <div className="verdict">
                  <Badge kind="pass">PASS</Badge>
                  <p>The node's verdict and attributed rules match the prediction.</p>
                </div>
                <div className="verdict">
                  <Badge kind="finding">FINDING</Badge>
                  <p>A mismatch the analyzer can state precisely. A candidate to verify against the spec, not a confirmed bug.</p>
                </div>
                <div className="verdict">
                  <Badge kind="inconclusive">INCONCLUSIVE</Badge>
                  <p>Unknown wording, unevaluated rules, a stage that was never reached, or a skipped scenario.</p>
                </div>
                <div className="verdict">
                  <Badge kind="error">ERROR</Badge>
                  <p>Transport or RPC failure. No verdict was obtained.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="cap">
            <div className="cap-text">
              <p className="eyebrow">Reproducible evidence</p>
              <h3>Findings you can hand to a maintainer.</h3>
              <p>
                Every run writes <code>results.json</code>, <code>findings.json</code> and <code>report.md</code>. Findings carry a
                SHA-256 fingerprint over policy, scenario hash and verdicts, plus the full observation including the signed request.
              </p>
              <dl className="cap-facts">
                <div>
                  <dt>Why</dt>
                  <dd>A finding is only useful if someone else can see exactly what was sent and what came back.</dd>
                </div>
                <div>
                  <dt>You get</dt>
                  <dd>Stable identifiers to deduplicate across runs, and files you can commit.</dd>
                </div>
              </dl>
            </div>
            <div className="cap-visual">
              <CodeBlock
                code={FINDING_SUMMARY}
                lang="json"
                filename="docs/evidence/mutants/mutant-run-3/findings.json"
                href={repoFile("docs/evidence/mutants/mutant-run-3/findings.json")}
                maxHeight={420}
                caption="Recorded 2026-11-06. The raw request/response is summarised here; it is complete in the file."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const PLAY = [
  {
    t: "Explore the CLI",
    d: "Two commands: run and mutate.",
    session: S.HELP,
    caption: "Verbatim output from this repository.",
    what: "Lists the CLI surface. run sends scenarios to a sidecar and reports; mutate generates variants offline.",
    look: "mutate states that nothing is sent to a node. Generation and execution are deliberately separate steps.",
  },
  {
    t: "Baseline",
    d: "A valid transaction, admitted.",
    session: S.RUN_BASELINE_FUNDED,
    caption: (
      <>
        Reconstructed from <code>docs/evidence/valid-self-verify/results.json</code>, recorded 2026-11-06 14:50 UTC with a funded devnet key.
      </>
    ),
    what: "Submits the simplest valid prefix: one self_verify frame plus a SENDER frame. The policy predicts accept.",
    look: "[admitted] and a transaction hash. Admitted means accepted into the pool, not mined. Without a funded key the same scenario stops at [solvency].",
  },
  {
    t: "Adversarial mutation",
    d: "Generate variants offline.",
    session: S.MUTATE_ATOMIC,
    caption: "Verbatim output. Re-run with the same --now and you get byte-identical files.",
    what: "Toggles the atomic batch flag on each frame of valid-self-verify, compile-checks each variant, and predicts its verdict.",
    look: "Two mutants. Flag on frame 0 is predicted reject (PREFIX-040); flag on frame 1 is predicted accept. These are predictions, not observations.",
  },
  {
    t: "Execution result",
    d: "Send a mutant to the node.",
    session: S.RUN_MUTANT_LAST,
    caption: (
      <>
        Reconstructed from <code>docs/evidence/mutants/mutant-run-3</code>, recorded 2026-11-06 15:36 UTC.
      </>
    ),
    what: "Submits the frame-1 mutant. The policy predicted accept; the node rejected it with wording no pattern recognises.",
    look: "FINDING with stage [other]. Investigation traced it to an EIP-8141 constraint the ERC-8421 policy does not encode: a gap in the policy, not a node bug.",
  },
  {
    t: "Evidence report",
    d: "What the run wrote to disk.",
    session: `$ cat out/<run-id>/report.md\n${FILES.run3Report.trimEnd()}`,
    caption: (
      <>
        Verbatim <code>docs/evidence/mutants/mutant-run-3/report.md</code>.
      </>
    ),
    what: "The Markdown report: target, policy pin, a predicted-vs-observed table with stages, and every finding with its fingerprint.",
    look: "The node's exact wording under “node said:”. The fingerprint is stable for the same policy, scenario and verdicts.",
  },
];

function Playground() {
  const [i, setI] = useState(0);
  const p = PLAY[i]!;
  return (
    <section className="section" id="playground" aria-labelledby="play-title">
      <div className="container">
        <SectionHead
          eyebrow="Walkthrough"
          id="play-title"
          title="See the workflow. Not just the promise."
          lede="Real commands with their real output. Offline commands are verbatim; devnet runs are reconstructed line for line from committed evidence files."
        />
        <div className="play">
          <ul className="play-list" aria-label="Walkthrough steps">
            {PLAY.map((x, n) => (
              <li key={x.t}>
                <button type="button" aria-pressed={n === i} className={`play-item${n === i ? " is-active" : ""}`} onClick={() => setI(n)}>
                  <span className="play-n">0{n + 1}</span>
                  <span className="play-t">{x.t}</span>
                  <span className="play-d">{x.d}</span>
                </button>
              </li>
            ))}
          </ul>
          <div aria-live="polite">
            <TerminalBlock key={i} session={p.session} title={`adversyn — ${p.t.toLowerCase()}`} caption={p.caption} />
            <div className="play-explain">
              <div>
                <h4>What it does</h4>
                <p>{p.what}</p>
              </div>
              <div>
                <h4>What to look for</h4>
                <p>{p.look}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Compare() {
  const rows: [string, string, React.ReactNode][] = [
    ["Expected transaction flows", "Supported", "Declarative YAML scenarios with an optional expected verdict, checked against the policy in CI"],
    ["Adversarial inputs", "Hand-written per suite, where they exist", <>Six deterministic operators with provenance (<code>adversyn mutate</code>)</>],
    ["Execution against a real alt-mempool", "Usually custom scripts", <>Built in: compile, sign, <code>eth_sendFrameTransaction</code></>],
    ["Record of node behaviour", "Often just pass/fail", "Exact reason text, stage, hash and raw request/response per scenario"],
    ["Expected vs actual analysis", "Usually manual", "Stage-aware analyzer; unknown wording stays inconclusive"],
    ["Reproducible evidence", "Varies", "Fingerprinted findings, scenario hashes, pinned policy version"],
  ];
  return (
    <section className="section section--alt" aria-labelledby="cmp-title">
      <div className="container">
        <SectionHead
          eyebrow="What makes it different"
          id="cmp-title"
          title="Not another test runner. A way to challenge the implementation itself."
        />
        <div className="compare">
          <table>
            <thead>
              <tr>
                <th scope="col">Capability</th>
                <th scope="col">Typical test suite</th>
                <th scope="col">Adversyn</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([a, b, c]) => (
                <tr key={a}>
                  <td>{a}</td>
                  <td>{b}</td>
                  <td>{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="compare-foot">
          “Typical test suite” describes common practice, not any specific tool. Adversyn complements unit and integration tests; it
          does not replace them, and today it covers structural rules only.
        </p>
        <p className="compare-thesis">
          Adversyn connects protocol expectations, adversarial inputs, real implementation behaviour and reproducible evidence in one
          workflow.
        </p>
      </div>
    </section>
  );
}

function ArchSection() {
  return (
    <section className="section" aria-labelledby="arch-title">
      <div className="container">
        <SectionHead
          eyebrow="Architecture"
          id="arch-title"
          title="A testing pipeline built around observable behaviour."
          lede="Nine TypeScript packages in a pnpm workspace. Select a component to see what it consumes and produces."
        />
        <Architecture />
      </div>
    </section>
  );
}

function Audience() {
  const a = [
    {
      t: "Alternative mempool operators",
      d: "Validate admission behaviour and stress-test transaction validation boundaries against the rules you claim to enforce.",
      u: "adversyn run --rpc <your-sidecar>",
    },
    {
      t: "Transaction infrastructure developers",
      d: "Integrate adversarial scenarios into development and release workflows. Fail the pipeline when a finding appears.",
      u: "adversyn run --fail-on-finding",
    },
    {
      t: "Protocol engineers",
      d: "Turn ERC-8421 requirements into executable test cases and investigate where implementations and draft revisions differ.",
      u: "scenarios/*.yaml · @adversyn/policy",
    },
    {
      t: "Security auditors",
      d: "Use reproducible scenarios and fingerprinted evidence when assessing transaction-validation infrastructure.",
      u: "findings.json · provenance",
    },
  ];
  return (
    <section className="section section--alt" aria-labelledby="aud-title">
      <div className="container">
        <SectionHead eyebrow="Who it's for" id="aud-title" title="Built for teams responsible for transaction infrastructure." />
        <div className="audience">
          {a.map((x) => (
            <div className="aud" key={x.t}>
              <h3>{x.t}</h3>
              <p>{x.d}</p>
              <p className="aud-use">{x.u}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="cta">
      <div className="container cta-inner">
        <div>
          <h2>Don't just test the happy path. Test the implementation.</h2>
          <p>
            Start exploring Adversyn's testing workflow and see how executable adversarial testing can improve confidence in
            alternative mempool infrastructure.
          </p>
        </div>
        <div className="cta-actions">
          <Link to="/docs" className="btn btn-primary">
            Read the Documentation
          </Link>
          <a href={REPO_URL} className="btn btn-secondary" target="_blank" rel="noreferrer">
            <GitHubIcon /> Explore on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

export function Home() {
  useEffect(() => {
    document.title = "Adversyn — Adversarial conformance testing for Frame Transaction mempools";
  }, []);
  return (
    <main id="main">
      <Hero />
      <Problem />
      <HowSection />
      <Capabilities />
      <Playground />
      <Compare />
      <ArchSection />
      <Audience />
      <FinalCta />
    </main>
  );
}
