import { Link } from "react-router-dom";
import { DocsLayout, H2, H3 } from "../../components/DocsLayout";
import { T, Next, docPage, Ext } from "../../components/DocBits";
import { TerminalBlock } from "../../components/TerminalBlock";
import { CodeBlock } from "../../components/CodeBlock";
import { Badge, Callout } from "../../components/Chrome";
import {
  ALLOWED_SHAPES,
  DEVNET_RPC,
  DEFAULT_PROFILE,
  OPERATORS,
  RULES,
  STAGES,
  UNEVALUATED,
  explorerTx,
  repoFile,
  TX_A,
  short,
} from "../../content/facts";
import { FILES, PATHS, MANIFEST_CASES, MANIFEST_EXCERPT, PREDICTION_EXAMPLE, WIRE_REQUEST, FINDING_SUMMARY, RESULT_VALID, provenanceOf, framesOf } from "../../content/repoFiles";
import * as S from "../../content/sessions";

const fmt = (v: unknown) => (v === null ? "(absent)" : typeof v === "string" ? v : JSON.stringify(v));

/* ------------------------------------------------------------------ */
/* CLI reference                                                      */
/* ------------------------------------------------------------------ */

export function CliReference() {
  return (
    <DocsLayout page={docPage("cli")} source="packages/cli/src/index.ts">
      <p>
        The CLI has two commands. <code>run</code> talks to a node; <code>mutate</code> never does. Invoke both from the repository root
        with <code>pnpm adversyn</code>.
      </p>
      <TerminalBlock session={S.HELP} title="pnpm adversyn --help" />

      <H2 id="adversyn-run">adversyn run</H2>
      <p>
        Loads scenarios, predicts each one with the policy, compiles and submits it to the target sidecar, compares the observation with
        the prediction, prints one line per scenario and writes a report.
      </p>
      <CodeBlock code="pnpm adversyn run [dir] [options]" lang="text" filename="Syntax" />

      <H3 id="run-arguments">Arguments</H3>
      <T head={["Argument", "Default", "Description"]} rows={[[<code>dir</code>, <code>scenarios/examples</code>, "Directory of .yaml / .yml scenario files"]]} />

      <H3 id="run-options">Options</H3>
      <T
        head={["Option", "Default", "Description"]}
        rows={[
          [<code>--rpc &lt;url&gt;</code>, <code>{DEVNET_RPC}</code>, "Sidecar JSON-RPC URL"],
          [<code>--chain-id &lt;n&gt;</code>, <code>1337</code>, "Chain id used when signing"],
          [<code>--profile &lt;name&gt;</code>, <code>{DEFAULT_PROFILE}</code>, "hegota-support encoding profile"],
          [<code>--only &lt;ids&gt;</code>, "all", "Comma-separated scenario ids. Unknown ids are ignored"],
          [<code>--delay &lt;ms&gt;</code>, <code>300</code>, "Pause after each submitted scenario"],
          [<code>--out &lt;dir&gt;</code>, <code>out/run-&lt;timestamp&gt;</code>, "Report directory"],
          [<code>--fail-on-finding</code>, "off", "Exit 1 if any finding is produced"],
          [<code>-h, --help</code>, "", "Show help"],
        ]}
      />
      <p>
        Environment: <code>ADVERSYN_PRIVATE_KEY</code> (optional). See <Link to="/docs/configuration#keys-and-funding">Keys and funding</Link>.
      </p>

      <H3 id="run-examples">Examples</H3>
      <TerminalBlock
        title="examples"
        session={`# every example scenario against the public devnet
$ pnpm adversyn run
# a subset
$ pnpm adversyn run --only invalid-atomic-in-prefix,invalid-verify-after-prefix
# generated scenarios, written to a fixed folder
$ pnpm adversyn run scenarios/generated/scenarios --out out/generated
# CI: exit 1 on any finding
$ pnpm adversyn run --out out/ci --fail-on-finding`}
      />

      <H3 id="run-output">Output</H3>
      <p>
        A header with the target and sender mode, then one line per scenario: result, scenario id and <code>[stage]</code>, followed by
        indented notes. A summary line and the paths of the three files written end the run.
      </p>
      <TerminalBlock
        session={S.RUN_ALL_HISTORICAL}
        title="pnpm adversyn run"
        caption={
          <>
            Historical run, 2026-11-06 03:58 UTC, reconstructed from <code>docs/evidence/budget-drift/fifth</code>. It predates two changes:
            current versions print <code>node said:</code> under each static PASS, and <code>invalid-stray-default-frame</code> was
            renamed <code>lead-deploy-not-deploying-sender</code>. The devnet has since removed its gas limits, so the budget scenarios no
            longer reject there.
          </>
        }
      />

      <H3 id="run-exit-behaviour">Exit behaviour</H3>
      <T
        head={["Situation", "Exit code"]}
        wrap
        rows={[
          ["Run completed (findings, inconclusive results and errors are reported, not fatal)", <code>0</code>],
          [<>Run completed, <code>--fail-on-finding</code> given, at least one finding</>, <code>1</code>],
          ["A scenario file is invalid YAML, fails the schema, or two files share an id (thrown before any submission)", <code>1</code>],
        ]}
      />
      <Callout kind="info">An unreachable RPC does not fail the run. Each affected scenario is reported as ERROR and the exit code stays 0 unless you gate on findings.</Callout>

      <H2 id="adversyn-mutate">adversyn mutate</H2>
      <p>Generates deterministic mutated scenarios from seed scenarios. Offline: nothing is sent to a node and no key is needed.</p>
      <CodeBlock code="pnpm adversyn mutate [dir] [options]" lang="text" filename="Syntax" />
      <H3 id="mutate-arguments">Arguments</H3>
      <T head={["Argument", "Default", "Description"]} rows={[[<code>dir</code>, <code>scenarios/examples</code>, "Seed scenario directory"]]} />
      <H3 id="mutate-options">Options</H3>
      <T
        head={["Option", "Default", "Description"]}
        rows={[
          [<code>--only &lt;ids&gt;</code>, "all seeds", "Comma-separated seed ids. Unknown ids are an error"],
          [<code>--operators &lt;ids&gt;</code>, "all", "Comma-separated operator ids"],
          [<code>--max &lt;n&gt;</code>, "unlimited", "Maximum number of generated scenarios"],
          [<code>--now &lt;unixSec&gt;</code>, "current time", "Time for time-dependent rules; recorded in the manifest"],
          [<code>--out &lt;dir&gt;</code>, <code>out/mutants</code>, "Output directory"],
          [<code>--overwrite</code>, "off", "Replace files from a previous run in --out"],
          [<code>-h, --help</code>, "", "Show help"],
        ]}
      />
      <H3 id="mutate-examples">Examples</H3>
      <TerminalBlock
        title="examples"
        session={`# all seeds, all operators
$ pnpm adversyn mutate --out out/mutants
# one seed, one operator, reproducible
$ pnpm adversyn mutate --only valid-self-verify --operators atomic-flag --now 1800000000 --out out/mutants-atomic
# a bounded batch
$ pnpm adversyn mutate --operators gas-boundary,frame-order --max 10 --out out/mutants-small`}
      />
      <H3 id="mutate-output">Output</H3>
      <TerminalBlock session={S.MUTATE_ALL} title="pnpm adversyn mutate" caption="Verbatim output over all 14 example seeds." />
      <p>
        Files: <code>&lt;out&gt;/manifest.json</code> and <code>&lt;out&gt;/scenarios/&lt;id&gt;.yaml</code>. The console shows the first
        15 skips; the manifest has all of them.
      </p>
      <H3 id="mutate-exit-behaviour">Exit behaviour</H3>
      <T
        head={["Situation", "Exit code", "Message"]}
        wrap
        rows={[
          ["Success", <code>0</code>, ""],
          [<>Unknown id in <code>--only</code></>, <code>1</code>, <code>error: unknown seed scenario id(s): …</code>],
          [<><code>--max</code> not a non-negative integer</>, <code>1</code>, <code>error: --max must be a non-negative integer</code>],
          [<><code>--now</code> not a non-negative integer</>, <code>1</code>, <code>error: --now must be a unix time in seconds</code>],
          ["Target file exists without --overwrite", <code>1</code>, <code>error: … already exists; choose a new --out directory or pass --overwrite</code>],
        ]}
      />
      <TerminalBlock session={`${S.MUTATE_UNKNOWN_SEED}\n${S.MUTATE_BAD_MAX}`} title="errors" compact />

      <H2>adversyn help</H2>
      <p>
        <code>pnpm adversyn help [command]</code> is equivalent to <code>--help</code>. See also <code>pnpm adversyn run --help</code> and{" "}
        <code>pnpm adversyn mutate --help</code>.
      </p>
      <TerminalBlock tabs={[{ label: "run --help", session: S.RUN_HELP }, { label: "mutate --help", session: S.MUTATE_HELP }]} title="help" />
    </DocsLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Scenarios                                                          */
/* ------------------------------------------------------------------ */

export function Scenarios() {
  return (
    <DocsLayout page={docPage("scenarios")} source="packages/core/src/scenario.ts">
      <p>
        A scenario is a declarative description of one Frame Transaction plus metadata about what it is meant to test. Scenarios are
        YAML, validated with zod, and kept small enough to review in a pull request.
      </p>
      <CodeBlock code={FILES.validSelfVerify} lang="yaml" filename={PATHS.validSelfVerify} href={repoFile(PATHS.validSelfVerify)} />

      <H2>Schema</H2>
      <T
        head={["Field", "Type", "Default", "Meaning"]}
        wrap
        rows={[
          [<code>id</code>, "string", "required", <>Lowercase letters, digits, <code>. _ -</code>; unique per directory</>],
          [<code>title</code>, "string", "required", "Short human title"],
          [<code>description</code>, "string", "—", "Why the scenario exists"],
          [<code>tags</code>, "string[]", "[]", <>Free-form. <code>needs-deployed-contract</code> makes the executor skip it</>],
          [<code>exercises</code>, "string[]", "[]", "Rule ids the scenario targets; used to detect unevaluated rules"],
          [<code>seed</code>, "integer", "0", "Part of the schema and the scenario hash; not used by the compiler"],
          [<code>sender</code>, "address | generated", "generated", "Only generated can be compiled"],
          [<code>nonce</code>, "{ keys, seq }", <code>{`{keys:["0"],seq:"0"}`}</code>, "Keyed nonces are refused by the compiler"],
          [<code>fees</code>, "{ maxFeePerGas, maxPriorityFeePerGas }", "—", "Decimal strings; default max fee 2 gwei"],
          [<code>signature</code>, "valid | invalid | none", "valid", "Only valid can be compiled"],
          [<code>stake</code>, "{ sender, payer, factory }", "all false", "Any true makes the executor skip it"],
          [<code>frames</code>, "Frame[]", "required", "1 to 64 frames"],
          [<code>expect</code>, "{ verdict, ruleIds }", "—", "Expected verdict; checked against the policy in CI"],
          [<code>provenance</code>, "object", "—", "Present only on generated scenarios"],
        ]}
      />
      <H3>Frame</H3>
      <T
        head={["Field", "Type", "Default", "Meaning"]}
        wrap
        rows={[
          [<code>role</code>, "self_verify | only_verify | pay | expiry_verify | deploy | pre_verify | execution", "—", "Intent label; see below"],
          [<code>mode</code>, "VERIFY | DEFAULT | SENDER", "required", "EIP-8141 frame mode"],
          [<code>target</code>, "address | sender", "required", <><code>sender</code> compiles to a null target</>],
          [<code>limits</code>, "{ execution, state? }", "required", "Gas limits, non-negative integers"],
          [<code>value</code>, "decimal string", "\"0\"", "Wei"],
          [<code>data</code>, "hex", "\"0x\"", "Calldata"],
          [<code>atomicBatch</code>, "boolean", "false", "Sets the profile's ATOMIC_BATCH flag bit"],
          [<code>extra</code>, "record", "—", <>Role-specific data, e.g. <code>deadline</code> for expiry_verify</>],
        ]}
      />

      <H2>Roles are labels</H2>
      <p>
        <code>role</code> does not exist on the wire. The node infers roles from modes, approve scopes and positions. In the compiler a role
        reaches the transaction in exactly one place: the approve scope of a <code>VERIFY</code> frame (<code>self_verify</code> →
        execution and payment, <code>only_verify</code> → execution, <code>pay</code> → payment; anything else gets the default). The policy
        uses roles to reason about the prefix shape, so a wrong label can produce a misleading prediction. See the{" "}
        <code>lead-deploy-not-deploying-sender</code> scenario for a case where this matters.
      </p>

      <H2>How scenarios are loaded</H2>
      <ul>
        <li>Every file ending in <code>.yaml</code> or <code>.yml</code> in the directory is loaded, in sorted filename order. Subdirectories are not read.</li>
        <li>Each file is parsed and validated against the schema; the first invalid file stops the run with the file path and the zod issues.</li>
        <li>Two files with the same <code>id</code> stop the run with both paths.</li>
      </ul>

      <H2>Writing a scenario</H2>
      <ol>
        <li>Pick one rule to exercise and put its id in <code>exercises</code>.</li>
        <li>Start from the closest example and change the minimum needed to break (or satisfy) that rule.</li>
        <li>
          Add an <code>expect</code> block. <code>tests/scenarios.test.ts</code> asserts that the policy's prediction equals every example's{" "}
          <code>expect</code>, so a wrong expectation fails <code>pnpm test</code>.
        </li>
        <li>Run it alone with <code>--only</code> before adding it to a larger batch.</li>
      </ol>
      <CodeBlock code={FILES.invalidVerifyAfter} lang="yaml" filename={PATHS.invalidVerifyAfter} href={repoFile(PATHS.invalidVerifyAfter)} />

      <H2>From scenario to Frame Transaction</H2>
      <p>
        At run time <code>compileScenario()</code> builds each frame with the selected hegota-support profile, creates the transaction with
        the chain id, sender and nonce, adds a secp256k1 signature placeholder, signs it and encodes it for the wire. These cases are
        refused with an explicit reason and the scenario is reported as skipped:
      </p>
      <T
        head={["Condition", "Reason reported"]}
        wrap
        rows={[
          [<>signature is not <code>valid</code></>, <code>signature "invalid" is not supported yet</code>],
          [<>sender is an explicit address</>, <code>explicit sender addresses cannot be signed for</code>],
          [<>nonce keys other than <code>["0"]</code></>, <code>keyed nonces (EIP-8250) are not supported yet</code>],
          [<>a frame with role <code>expiry_verify</code></>, <code>frame N: role expiry_verify needs verifier/factory details not mapped yet</code>],
          [<>any <code>stake</code> flag true</>, <code>needs staked entities; staking is not arranged by Adversyn</code>],
          [<>tag <code>needs-deployed-contract</code></>, <code>needs a deployed contract (paymaster, wallet, ...) that Adversyn does not deploy yet</code>],
        ]}
      />
      <CodeBlock code={FILES.onlyVerifyPay} lang="yaml" filename={PATHS.onlyVerifyPay} href={repoFile(PATHS.onlyVerifyPay)} caption="A valid sponsored shape that is skipped until a real paymaster can be arranged." />

      <H2>Identity and hashes</H2>
      <ul>
        <li>
          <strong>scenarioHash</strong>: canonical SHA-256 over everything except <code>title</code>, <code>description</code>,{" "}
          <code>tags</code> and <code>provenance</code>. Used in observations and finding fingerprints.
        </li>
        <li>
          <strong>scenarioContentHash</strong>: covers exactly what is compiled and sent (sender, nonce, fees, signature, stake, frames). Used
          for mutant ids and duplicate detection.
        </li>
      </ul>
      <Next to="/docs/policy">How the policy evaluates a scenario</Next>
    </DocsLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Policy                                                             */
/* ------------------------------------------------------------------ */

export function Policy() {
  return (
    <DocsLayout page={docPage("policy")} source="packages/policy/src/rules.ts">
      <p>
        The policy is Adversyn's written expectation. <code>predict(scenario)</code> evaluates seven structural ERC-8421 rules and returns
        a verdict, the violated rule ids, a per-rule outcome, and the list of rules it did not evaluate.
      </p>
      <CodeBlock code={PREDICTION_EXAMPLE} lang="json" filename="prediction for valid-self-verify.atomic-flag.9172d677" href={repoFile(PATHS.manifest)} maxHeight={320} />

      <H2>Spec pin</H2>
      <p>
        Policy reference: <code>erc-8421-static:erc-8421@74a868cd</code>, the commit the alt-mempool workshop pins. That commit is not in
        the history of the <code>pr-clean</code> branch of the ERC draft (checked 2026-11-06), but the rules the policy encodes are
        unchanged across all five commits of that branch. EIP-8141 and ERC-8421 are drafts; expect rules and node wording to change.
      </p>

      <H2>Evaluated rules</H2>
      <T
        head={["Rule", "Checks", "Node wording observed 2026-11-06"]}
        wrap
        rows={RULES.map((r) => [<code>{r.id}</code>, r.summary, r.nodeText ? <code>{r.nodeText}</code> : <span style={{ color: "var(--muted)" }}>not attributable from text yet</span>])}
      />
      <H3>Prefix shapes</H3>
      <p>
        After stripping a leading <code>expiry_verify</code> frame and normalising roles, the prefix must be one of:{" "}
        {ALLOWED_SHAPES.map((s, i) => (
          <span key={s}>
            <code>[{s}]</code>
            {i < ALLOWED_SHAPES.length - 1 ? ", " : "."}
          </span>
        ))}{" "}
        A prefix with no <code>self_verify</code> or <code>pay</code> frame has no payer and fails PREFIX-010.
      </p>
      <H3>BUDGET-010 accounting</H3>
      <p>
        Verification gas is summed per entity. <code>self_verify</code> and <code>only_verify</code> count toward the sender;{" "}
        <code>pay</code> toward the sender if it targets the sender, otherwise the payer; <code>deploy</code> toward the factory;{" "}
        <code>pre_verify</code> toward whoever the next frame belongs to. The sender also carries the signature cost. Caps are 100,000 gas
        unstaked and 1,000,000 staked.
      </p>
      <Callout kind="warn" title="One measured constant">
        ERC-8421 says the signature cost counts toward the sender but gives no number. The policy uses{" "}
        <code>SECP256K1_VERIFY_COST_OBSERVED = 2800</code>, reported by the public sidecar on 2026-11-06. That puts the unstaked boundary at
        97,200 / 97,201. Later that day the devnet was restarted without gas limits, so BUDGET-010 can no longer be tested there.
      </Callout>

      <H2>Not evaluated</H2>
      <p>Every prediction lists these. A predicted “accept” means no static violation was found, not that a node will accept the transaction.</p>
      <p>
        {UNEVALUATED.map((u, i) => (
          <span key={u}>
            <code>{u}</code>
            {i < UNEVALUATED.length - 1 ? " " : ""}
          </span>
        ))}
      </p>
      <p>
        EIP-8141's own constraints are also missing. A generated mutant found one: the atomic-batch flag is not allowed on the last frame.
        Adding those constraints as an explicit rule is the documented follow-up.
      </p>

      <H2>Rules and stages</H2>
      <p>
        The node checks some rules before its solvency check and some after. Adversyn treats PREFIX-010, PREFIX-040, PREFIX-050 and
        BUDGET-010 as structural, because the public devnet was observed rejecting them before solvency. PREFIX-020 and PREFIX-120 depend
        on simulation or frame classification, so an unfunded run that stops at solvency cannot confirm them; the analyzer reports those
        as inconclusive and suggests a funded re-run.
      </p>
      <Next to="/docs/mutation">Mutation engine</Next>
    </DocsLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Mutation                                                           */
/* ------------------------------------------------------------------ */

export function Mutation() {
  const vsv = MANIFEST_CASES.filter((c) => c.provenance.parentId === "valid-self-verify");
  return (
    <DocsLayout page={docPage("mutation")} source="docs/Mutation.md">
      <p>
        <code>adversyn mutate</code> generates controlled variants of existing scenarios, offline and deterministically. Generated scenarios
        are <strong>candidates for testing</strong>. They are not findings and not confirmed vulnerabilities, and nothing is sent to a node
        by this command.
      </p>
      <TerminalBlock session={S.MUTATE_ATOMIC} title="pnpm adversyn mutate" />

      <H2>Pipeline</H2>
      <p>For each seed, for each operator (registry order), for each candidate:</p>
      <ol>
        <li>
          <strong>Build.</strong> Deep-copy the seed, apply the change, add provenance, assign the id, validate against the schema. No-ops and
          duplicates are skipped.
        </li>
        <li>
          <strong>Compile check.</strong> Run the real <code>compileScenario()</code> with a throwaway key that is never submitted. Anything
          the compiler cannot build is skipped with the compiler's message, so every emitted scenario can be executed.
        </li>
        <li>
          <strong>Predict.</strong> Call <code>predict()</code> and store the verdict, violated rules and unevaluated rules in the manifest.
        </li>
      </ol>
      <p>Only scenarios passing all three count toward <code>--max</code>. Every skip is recorded with seed, operator, field and reason.</p>

      <H2>Operators</H2>
      <p>
        Before/after values and predictions below are taken from the committed <code>scenarios/generated/manifest.json</code>, seed{" "}
        <code>valid-self-verify</code> (frame 0: <code>self_verify</code> VERIFY, 30,000 gas; frame 1: <code>execution</code> SENDER).
      </p>
      {OPERATORS.map((op) => {
        const cases = vsv.filter((c) => c.provenance.operator === op.id);
        return (
          <section key={op.id}>
            <H3 id={op.id}>{op.id}</H3>
            <dl className="defs">
              <div>
                <dt>Changes</dt>
                <dd>{op.changes}</dd>
              </div>
              <div>
                <dt>Why it matters</dt>
                <dd>{op.why}</dd>
              </div>
              <div>
                <dt>Probes</dt>
                <dd>{op.probes}</dd>
              </div>
              <div>
                <dt>Skipped</dt>
                <dd>{op.skips}</dd>
              </div>
            </dl>
            {cases.length > 0 && (
              <T
                head={["Mutant", "Field", "Before → after", "Prediction"]}
                wrap
                rows={cases.map((c) => [
                  <code>{c.id.split(".").slice(-1)[0]}</code>,
                  <code>{c.provenance.field}</code>,
                  <code>
                    {fmt(c.provenance.original)} → {fmt(c.provenance.mutated)}
                  </code>,
                  c.prediction.verdict === "reject" ? (
                    <Badge kind="neutral">reject {c.prediction.violated.join(", ")}</Badge>
                  ) : (
                    <Badge kind="neutral">accept</Badge>
                  ),
                ])}
              />
            )}
          </section>
        );
      })}
      <p>
        There is deliberately no operator that inserts new frames: a new frame needs a target and gas values, and choosing them would be
        inventing content. Invalid-signature, keyed-nonce and expiry-verifier mutations are not implemented because the compiler does not
        support them yet.
      </p>

      <H2>Provenance</H2>
      <CodeBlock code={provenanceOf(FILES.mutantGas)} lang="yaml" filename="valid-self-verify.gas-boundary.9a97a593.yaml" href={repoFile(PATHS.mutantGas)} />
      <T
        head={["Field", "Meaning"]}
        wrap
        rows={[
          [<code>parentId</code>, "The seed scenario's id"],
          [<code>parentContentHash</code>, "Content hash of the seed at generation time"],
          [<code>operator</code>, "The operator that produced it"],
          [<code>field</code>, <>The field changed, e.g. <code>frames[0].limits.execution</code></>],
          [<><code>original</code> / <code>mutated</code></>, <>Value before and after (<code>null</code> where a frame was absent)</>],
          [<code>policy</code>, "Policy version used for the prediction"],
          [<code>generation</code>, "Generator name and version"],
        ]}
      />
      <ul>
        <li>
          <strong>Id:</strong> <code>&lt;parentId&gt;.&lt;operator&gt;.&lt;first 8 hex of the content hash&gt;</code>, extended if taken.
        </li>
        <li>
          <strong>No inherited expectation:</strong> the parent's <code>expect</code> block is dropped. Tags gain <code>mutant</code> and{" "}
          <code>op:&lt;operator&gt;</code>.
        </li>
        <li>
          <strong>The parent is never modified.</strong>
        </li>
      </ul>
      <p>The changed frames of that mutant, as committed:</p>
      <CodeBlock code={framesOf(FILES.mutantGas)} lang="yaml" filename="frames" />

      <H2>Manifest</H2>
      <CodeBlock code={MANIFEST_EXCERPT} lang="json" filename={PATHS.manifest} href={repoFile(PATHS.manifest)} maxHeight={420} />

      <H2>Determinism and reproduction</H2>
      <p>
        Identical inputs produce byte-identical output. The manifest contains no generation timestamp; <code>--now</code> is an input and is
        recorded in <code>context.nowSec</code>. To reproduce a mutant, re-run with the same seeds, operators, <code>--max</code> and{" "}
        <code>--now</code>. The committed set was generated with <code>--now 1800000000 --max 24</code> over three seeds, and a test (
        <code>tests/mutation-generated-sync.test.ts</code>) keeps it in sync with the engine.
      </p>
      <p>
        With <code>--max</code>, generation stops after <code>n</code> scenarios in order, so early seeds and operators fill the budget first.
        Use <code>--only</code> and <code>--operators</code> to spread coverage deliberately.
      </p>
      <Callout kind="note" title="Overwrite behaviour">
        The command refuses to write if any target file exists unless <code>--overwrite</code> is given. <code>--overwrite</code> only
        replaces files it is about to write and never deletes anything, so files from an earlier run with different options can remain. Use a
        new <code>--out</code> when options change.
      </Callout>

      <H2>Running mutants</H2>
      <TerminalBlock session={`$ pnpm adversyn run out/mutants/scenarios --only valid-self-verify.atomic-flag.9172d677`} title="execute a mutant" compact />
      <p>
        Mutants can be numerous. On a shared devnet, send a small deliberate subset with <code>--only</code>, keep the default pacing, and do
        not generate mass-rejection traffic. A mismatch between prediction and observation is judged by the same conservative analyzer as
        any other scenario.
      </p>
      <Next to="/docs/execution">Execution</Next>
    </DocsLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Execution                                                          */
/* ------------------------------------------------------------------ */

export function Execution() {
  return (
    <DocsLayout page={docPage("execution")} source="packages/executor/src/index.ts">
      <p>
        Execution turns a scenario into a signed Frame Transaction, submits it to the target sidecar, and records an observation. The
        executor records facts; it never decides whether the node was right.
      </p>

      <H2>Order of operations</H2>
      <ol>
        <li>
          <strong>Pre-filter.</strong> Scenarios with any <code>stake</code> flag, or tagged <code>needs-deployed-contract</code>, are skipped
          without touching the network.
        </li>
        <li>
          <strong>Key and nonce.</strong> With <code>ADVERSYN_PRIVATE_KEY</code>: derive the address and read the nonce with{" "}
          <code>eth_getTransactionCount(address, "latest")</code>. Without it: generate a fresh key, nonce 0.
        </li>
        <li>
          <strong>Compile.</strong> <code>compileScenario()</code> builds, signs and encodes. Unsupported scenarios are skipped with the
          compiler's reason.
        </li>
        <li>
          <strong>Submit.</strong> <code>eth_sendFrameTransaction</code> with the wire transaction. Wall-clock duration is recorded.
        </li>
        <li>
          <strong>Record.</strong> An <code>Observation</code> with outcome, hash or error, target, timing and the raw request and response.
        </li>
      </ol>

      <H2>The wire transaction</H2>
      <CodeBlock code={WIRE_REQUEST} lang="json" filename="observation.raw.request · mutant-run-3" href={repoFile("docs/evidence/mutants/mutant-run-3/findings.json")} maxHeight={420} caption="Signed with a throwaway devnet key. Quantities are hex: 0x7530 = 30,000 gas, 0x539 = chain 1337." />

      <H2>Admission</H2>
      <p>
        A successful reply means the sidecar admitted the transaction into its pool. Adversyn records the hash returned by the node (or the
        locally computed hash if the reply is not a string) and prints it as a note.
      </p>
      <TerminalBlock session={S.RUN_BASELINE_FUNDED} title="admitted" caption={<>Reconstructed from <code>docs/evidence/valid-self-verify</code>, 2026-11-06 14:50 UTC.</>} />
      <p>
        Look the hash up in the explorer:{" "}
        <Ext href={explorerTx(TX_A)}>
          <span className="mono">{short(TX_A)}</span>
        </Ext>
        . Admitted is not mined: this transaction was still pending (“New”) when captured.
      </p>
      <CodeBlock code={RESULT_VALID} lang="json" filename="docs/evidence/valid-self-verify/results.json" href={repoFile("docs/evidence/valid-self-verify/results.json")} />

      <H2>Rejection</H2>
      <p>
        A JSON-RPC error is recorded as <code>outcome: "rejected"</code> with the numeric error code and the message, which is also stored as
        a reason with <code>source: "rpc-error"</code>. The analyzer later decides which rule, if any, that text corresponds to.
      </p>
      <CodeBlock
        lang="json"
        filename="observation.submit · mutant-run-3"
        code={`{
  "outcome": "rejected",
  "rpcMethod": "eth_sendFrameTransaction",
  "errorCode": -32500,
  "errorMessage": "Frame 1: atomic batch flag on last frame",
  "reasons": [
    { "text": "Frame 1: atomic batch flag on last frame", "source": "rpc-error" }
  ]
}`}
      />
      <H3>Transport errors</H3>
      <p>
        If the node cannot be reached or returns a malformed response, the outcome is <code>error</code>, not <code>rejected</code>, and the
        scenario is reported as ERROR. This keeps infrastructure failures out of conformance results.
      </p>
      <TerminalBlock session={S.RUN_UNREACHABLE} title="unreachable target" caption="Verbatim output with nothing listening on the port." />

      <H2>Solvency and funded runs</H2>
      <p>
        An unfunded sender is stopped by the node's solvency check, which runs after structural checks and before simulation. The node's
        message looks like <code>the payer 0x… has 0 wei, the transaction's maximum cost is … wei</code>; the analyzer classifies it as
        stage <code>solvency</code> and treats it as “structural rules passed, later rules not exercised”.
      </p>
      <p>
        To reach simulation-dependent rules, use a funded throwaway devnet key in <code>ADVERSYN_PRIVATE_KEY</code>. Never use a production
        key and never commit one. Each submission is a real transaction on shared infrastructure.
      </p>
      <Next to="/docs/findings">Findings & reports</Next>
    </DocsLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Findings & reports                                                 */
/* ------------------------------------------------------------------ */

export function Findings() {
  return (
    <DocsLayout page={docPage("findings")} source="packages/analyzer/src/compare.ts">
      <p>
        Adversyn keeps three things separate at every step. Mixing them up is the most common way to over-read a result.
      </p>
      <dl className="defs">
        <div>
          <dt>Specification requirement</dt>
          <dd>
            What ERC-8421 (and EIP-8141) actually require. Draft text, versioned by commit. Adversyn encodes part of it; it is the reference,
            not a test output.
          </dd>
        </div>
        <div>
          <dt>Policy prediction</dt>
          <dd>
            What <code>@adversyn/policy</code> expects for this scenario under <code>erc-8421@74a868cd</code>. It can be wrong or incomplete,
            and it lists what it does not evaluate.
          </dd>
        </div>
        <div>
          <dt>Actual observation</dt>
          <dd>What the target node did on a given date: admitted with a hash, rejected with text, or failed to respond.</dd>
        </div>
      </dl>
      <p>
        A finding is a disagreement between the second and third. Whether it is a node bug, a policy gap or a spec ambiguity is decided by
        reading the specification, not by the tool.
      </p>

      <H2>Results</H2>
      <T
        head={["Result", "Meaning", "What to do"]}
        wrap
        rows={[
          [<Badge kind="pass">PASS</Badge>, "Verdicts agree, and any rules the node named are among those predicted.", "Note the stage: a solvency-stage PASS covers structural rules only."],
          [<Badge kind="finding">FINDING</Badge>, "A precise mismatch between prediction and observation.", "Treat as a candidate. Check the spec text before believing it. Report to maintainers before publishing."],
          [<Badge kind="inconclusive">INCONCLUSIVE</Badge>, "The tool cannot judge: unknown wording, unevaluated rule, unreached stage, or skipped.", "Read the note; it says why. Often a funded re-run or a new reason pattern resolves it."],
          [<Badge kind="error">ERROR</Badge>, "Submission failed before any verdict.", <>Fix connectivity; see <Link to="/docs/troubleshooting">Troubleshooting</Link>.</>],
        ]}
      />
      <Callout kind="note" title="Unknown stays unknown">
        Rejections whose wording matches no known pattern are never attributed to a rule by guesswork. If both sides reject, the verdict
        agrees but attribution is missing: INCONCLUSIVE. Scenarios exercising a rule the policy does not evaluate are INCONCLUSIVE even when
        the node accepts. Unmodeled conditions are not presented as confirmed failures.
      </Callout>

      <H2>Stages</H2>
      <T head={["Stage", "Meaning"]} wrap rows={STAGES.map((s) => [<code>{s.id}</code>, s.meaning])} />
      <p>
        Stages come from dated patterns in <Ext href={repoFile("packages/analyzer/src/reasons.ts")}>reasons.ts</Ext>. Each records the
        exact text observed and when. To support a new node message, add a pattern with its observed example and date.
      </p>

      <H2>Finding fields</H2>
      <T
        head={["Field", "Values", "Meaning"]}
        wrap
        rows={[
          [<code>class</code>, <>conformance, no-oracle (also reserved: differential, consistency)</>, "conformance: node vs policy rule; no-oracle: rejected for an unrecognised reason"],
          [<code>status</code>, "violation, anomaly", "violation: a rule outcome differs; anomaly: something unexpected that is not a clean rule mismatch"],
          [<code>severity</code>, "high, medium, low", "high: node admitted what the policy rejects. medium: rule-level mismatch. low: unrecognised rejection"],
          [<code>fingerprint</code>, "SHA-256", "Over class, policy, scenario hash, sorted expected and observed verdicts. Stable across runs"],
          [<><code>expected</code> / <code>observed</code></>, "verdict + ruleIds", "Prediction and classified observation"],
          [<code>evidence</code>, "notes + observation", <>Includes every <code>node said:</code> line and the complete raw exchange</>],
        ]}
      />
      <CodeBlock code={FINDING_SUMMARY} lang="json" filename="docs/evidence/mutants/mutant-run-3/findings.json" href={repoFile("docs/evidence/mutants/mutant-run-3/findings.json")} maxHeight={460} caption="The raw request/response is summarised here; it is complete in the file." />
      <p>
        This is a real finding. Investigation showed the node was enforcing an EIP-8141 constraint the policy does not encode, so it was
        documented as a gap in the policy rather than a node bug. That is the intended workflow:{" "}
        <Link to="/examples/evidence">read the full write-up</Link>.
      </p>

      <H2>Report files</H2>
      <T
        head={["File", "Contents"]}
        wrap
        rows={[
          [<code>results.json</code>, <>{"{ meta: { policy, target, generatedAt }, entries: ReportEntry[] }"} — every scenario, including skipped ones</>],
          [<code>findings.json</code>, "An array of Finding objects only; [] when there are none"],
          [<code>report.md</code>, "Summary, a predicted-vs-observed table with stages, findings, and notes"],
        ]}
      />
      <H3>Sample report</H3>
      <CodeBlock code={FILES.sampleReport} lang="md" filename={PATHS.sampleReport} href={repoFile(PATHS.sampleReport)} maxHeight={520} />
      <Next to="/docs/troubleshooting">Troubleshooting</Next>
    </DocsLayout>
  );
}
