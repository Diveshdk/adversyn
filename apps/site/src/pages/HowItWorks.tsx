import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge, SectionHead } from "../components/Chrome";
import { Workflow } from "../components/Workflow";
import { Architecture } from "../components/Architecture";
import { CodeBlock } from "../components/CodeBlock";
import { TerminalBlock } from "../components/TerminalBlock";
import { repoFile } from "../content/facts";
import { FILES, PATHS, PREDICTION_EXAMPLE, provenanceOf, OBSERVATION_FULL } from "../content/repoFiles";
import * as S from "../content/sessions";

function Stage({ n, name, pkg, children, visual, id }: { n: string; name: string; pkg: string; children: ReactNode; visual: ReactNode; id: string }) {
  return (
    <div className="cap" id={id}>
      <div className="cap-text prose">
        <p className="eyebrow">
          {n} · {name}
        </p>
        <h3 style={{ marginTop: 12 }}>{pkg}</h3>
        {children}
      </div>
      <div className="cap-visual">{visual}</div>
    </div>
  );
}

export function HowItWorks() {
  useEffect(() => {
    document.title = "How It Works · Adversyn";
  }, []);
  return (
    <main id="main">
      <header className="page-head">
        <div className="container">
          <p className="eyebrow">How it works</p>
          <h1>One scenario, six stages, one piece of evidence.</h1>
          <p className="lede">
            This page follows <code>valid-self-verify</code> and its atomic-flag mutants through the pipeline. Every artifact shown is a
            real file from the repository.
          </p>
        </div>
      </header>

      <section className="section section--tight">
        <div className="container">
          <Workflow />
          <p className="compare-foot" style={{ marginTop: 40 }}>
            In the CLI, stages 01 and 03–06 run inside <code>adversyn run</code>. Stage 02 is the separate, offline{" "}
            <code>adversyn mutate</code> command, whose output you then pass to <code>run</code>. You can skip it and run hand-written
            scenarios directly.
          </p>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <SectionHead eyebrow="Stage by stage" title="What each stage consumes and produces." />
          <div className="caps">
            <Stage
              id="simulate"
              n="01"
              name="Simulate"
              pkg="@adversyn/policy · predict()"
              visual={
                <>
                  <CodeBlock code={FILES.validSelfVerify} lang="yaml" filename={PATHS.validSelfVerify} href={repoFile(PATHS.validSelfVerify)} />
                  <CodeBlock code={PREDICTION_EXAMPLE} lang="json" filename="prediction · manifest.json" href={repoFile(PATHS.manifest)} maxHeight={300} />
                </>
              }
            >
              <p>
                The policy normalises the validation prefix (the leading frames that verify and pay), checks it against the allowed
                shapes, and runs seven rule evaluators. The result is a <strong>prediction</strong>: a verdict, the rule IDs it expects to
                be violated, and the full list of rules it did not evaluate.
              </p>
              <p>
                “Simulate” here means static evaluation. Nothing is executed and no network is touched. The one measured input is the
                2,800-gas secp256k1 signature cost the sidecar reported, recorded as observed, not specified.
              </p>
            </Stage>

            <Stage
              id="attack"
              n="02"
              name="Attack"
              pkg="@adversyn/mutation · adversyn mutate"
              visual={
                <>
                  <TerminalBlock session={S.MUTATE_ATOMIC} title="offline" />
                  <CodeBlock code={provenanceOf(FILES.mutantFirst)} lang="yaml" filename="valid-self-verify.atomic-flag.9172d677.yaml" href={repoFile(PATHS.mutantFirst)} />
                </>
              }
            >
              <p>
                For each seed, each operator and each candidate: deep-copy the seed, apply one change, stamp provenance, validate, compile
                offline with a throwaway key that is never submitted, then predict. Only candidates that pass all three are written.
              </p>
              <p>
                The id ends in the first 8 hex characters of a content hash over exactly what is compiled and sent, so two mutants with the
                same wire content cannot both exist.
              </p>
            </Stage>

            <Stage
              id="execute"
              n="03"
              name="Execute"
              pkg="@adversyn/protocol · @adversyn/executor"
              visual={
                <div className="table-wrap" style={{ margin: 0 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Scenario role (VERIFY frame)</th>
                        <th>Wire approve scope</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>self_verify</code></td>
                        <td><code>EXECUTION_AND_PAYMENT</code></td>
                      </tr>
                      <tr>
                        <td><code>only_verify</code></td>
                        <td><code>EXECUTION</code></td>
                      </tr>
                      <tr>
                        <td><code>pay</code></td>
                        <td><code>PAYMENT</code></td>
                      </tr>
                      <tr>
                        <td>any other role</td>
                        <td><code>EXECUTION_AND_PAYMENT</code> (default)</td>
                      </tr>
                      <tr>
                        <td><code>expiry_verify</code></td>
                        <td>refused: not mapped yet → skipped</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              }
            >
              <p>
                The compiler maps each frame to an EIP-8141 frame with <code>@forshtat/hegota-support</code>: mode, target, gas limits,
                value, data, the atomic-batch flag bit and the approve scope. It signs the transaction with viem and encodes the wire format.
              </p>
              <p>
                The executor then calls <code>eth_sendFrameTransaction</code> on the configured sidecar. By default each scenario gets a
                fresh throwaway key and nonce 0. With <code>ADVERSYN_PRIVATE_KEY</code> set, it reads the live nonce with{" "}
                <code>eth_getTransactionCount</code>.
              </p>
            </Stage>

            <Stage
              id="observe"
              n="04"
              name="Observe"
              pkg="Observation (facts only)"
              visual={
                <CodeBlock
                  code={OBSERVATION_FULL}
                  lang="json"
                  filename="observation · mutant-run-3/findings.json"
                  href={repoFile("docs/evidence/mutants/mutant-run-3/findings.json")}
                  maxHeight={440}
                />
              }
            >
              <p>
                An observation records what happened and nothing else: outcome (<code>admitted</code>, <code>rejected</code> or{" "}
                <code>error</code>), transaction hash or the node's error code and message, timing, the target, and the complete raw
                request and response.
              </p>
              <p>
                Transport failures such as an unreachable RPC are recorded as <code>error</code>, never as rejections, so infrastructure
                problems cannot masquerade as node behaviour.
              </p>
            </Stage>

            <Stage
              id="analyze"
              n="05"
              name="Analyze"
              pkg="@adversyn/analyzer · classify() + compare()"
              visual={
                <div className="table-wrap" style={{ margin: 0 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Predicted</th>
                        <th>Observed</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>accept</td>
                        <td>admitted, or stopped at solvency</td>
                        <td><Badge kind="pass">PASS</Badge></td>
                      </tr>
                      <tr>
                        <td>accept, exercises an unevaluated rule</td>
                        <td>accept</td>
                        <td><Badge kind="inconclusive">INCONCLUSIVE</Badge></td>
                      </tr>
                      <tr>
                        <td>accept</td>
                        <td>reject, known rule</td>
                        <td><Badge kind="finding">FINDING</Badge> medium</td>
                      </tr>
                      <tr>
                        <td>accept</td>
                        <td>reject, unrecognised wording</td>
                        <td><Badge kind="finding">FINDING</Badge> low</td>
                      </tr>
                      <tr>
                        <td>reject</td>
                        <td>admitted</td>
                        <td><Badge kind="finding">FINDING</Badge> high</td>
                      </tr>
                      <tr>
                        <td>reject, simulation-dependent rule</td>
                        <td>stopped at solvency</td>
                        <td><Badge kind="inconclusive">INCONCLUSIVE</Badge></td>
                      </tr>
                      <tr>
                        <td>reject, structural rule</td>
                        <td>stopped at solvency</td>
                        <td><Badge kind="finding">FINDING</Badge> medium</td>
                      </tr>
                      <tr>
                        <td>reject</td>
                        <td>reject, same rule(s)</td>
                        <td><Badge kind="pass">PASS</Badge></td>
                      </tr>
                      <tr>
                        <td>reject</td>
                        <td>reject, unrecognised wording</td>
                        <td><Badge kind="inconclusive">INCONCLUSIVE</Badge></td>
                      </tr>
                      <tr>
                        <td>reject</td>
                        <td>reject, different rule</td>
                        <td><Badge kind="finding">FINDING</Badge> medium</td>
                      </tr>
                      <tr>
                        <td>any</td>
                        <td>validation code failed</td>
                        <td><Badge kind="inconclusive">INCONCLUSIVE</Badge></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              }
            >
              <p>
                <code>classify()</code> matches the node's text against dated patterns in <code>reasons.ts</code> to get rule IDs and a
                stage. <code>compare()</code> then applies the decision table on the right, taken directly from{" "}
                <a href={repoFile("packages/analyzer/src/compare.ts")} target="_blank" rel="noreferrer">
                  compare.ts
                </a>
                .
              </p>
              <p>
                The asymmetry is deliberate. When both sides reject but the wording is unknown, the verdict agrees and only attribution is
                missing, so the result is inconclusive. When the policy expected acceptance and the node refused for an unknown reason, that
                is a low-severity anomaly worth a human look.
              </p>
            </Stage>

            <Stage
              id="prove"
              n="06"
              name="Prove"
              pkg="@adversyn/reporter"
              visual={<CodeBlock code={FILES.run3Report} lang="md" filename="docs/evidence/mutants/mutant-run-3/report.md" href={repoFile("docs/evidence/mutants/mutant-run-3/report.md")} />}
            >
              <p>
                Each run writes three files to <code>out/&lt;run-id&gt;/</code> or <code>--out</code>. A finding's fingerprint is a SHA-256
                over its class, the policy reference, the scenario hash and the sorted expected and observed verdicts, so the same
                divergence produces the same fingerprint on every run.
              </p>
              <p>
                The scenario hash excludes title, description, tags and provenance: renaming a scenario does not change its identity, but
                changing a gas limit does.
              </p>
            </Stage>
          </div>
        </div>
      </section>

      <section className="section" id="architecture">
        <div className="container">
          <SectionHead
            eyebrow="Architecture"
            title="A testing pipeline built around observable behaviour."
            lede="Select a component for its inputs, outputs and source directory."
          />
          <Architecture />
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <SectionHead eyebrow="Principles" title="Built to be trusted, so built to be conservative." />
          <dl className="defs" style={{ maxWidth: 880 }}>
            <div>
              <dt>Observations are facts</dt>
              <dd>The executor records what the node said. Only the analyzer decides whether that matches the policy.</dd>
            </div>
            <div>
              <dt>Policy is versioned</dt>
              <dd>Rules are keyed by ERC-8421 IDs and tagged with the spec commit. Nothing is invented where the spec is silent.</dd>
            </div>
            <div>
              <dt>Unknown wording is never guessed</dt>
              <dd>Every known pattern records its exact text and the date it was observed. Anything else is unattributed.</dd>
            </div>
            <div>
              <dt>Stage-aware</dt>
              <dd>An unfunded sender stops at solvency, which proves the structural rules only. Later rules stay inconclusive.</dd>
            </div>
            <div>
              <dt>Honest accounting</dt>
              <dd>Every report lists skipped scenarios and why. Claims about a shared devnet carry dates.</dd>
            </div>
          </dl>
          <div className="hero-ctas" style={{ marginTop: 40 }}>
            <Link to="/docs/quickstart" className="btn btn-primary">
              Run it yourself
            </Link>
            <Link to="/docs/findings" className="btn btn-secondary">
              Interpreting results
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
