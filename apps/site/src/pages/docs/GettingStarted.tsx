import { Link } from "react-router-dom";
import { DocsLayout, H2 } from "../../components/DocsLayout";
import { T, Step, Look, Next, LinkCard, docPage, Ext } from "../../components/DocBits";
import { TerminalBlock } from "../../components/TerminalBlock";
import { CodeBlock } from "../../components/CodeBlock";
import { Callout } from "../../components/Chrome";
import { DEVNET_RPC, EXPLORER_URL, HEGOTA_SUPPORT_URL, REPO_URL, repoFile, repoTree, DEFAULT_PROFILE } from "../../content/facts";
import { FILES, PATHS, RESULT_2C } from "../../content/repoFiles";
import quickReport from "../../content/quickstart-report.md?raw";
import * as S from "../../content/sessions";

/* ------------------------------------------------------------------ */
/* Introduction                                                       */
/* ------------------------------------------------------------------ */

export function Introduction() {
  return (
    <DocsLayout page={docPage("")} source="README.md">
      <p>
        Adversyn is an adversarial conformance-testing suite for <strong>EIP-8141 Frame Transactions</strong> and{" "}
        <strong>ERC-8421 alternative mempools</strong>. It sends crafted transactions to a real alt-mempool sidecar, records exactly what
        the node says, and compares that against a versioned policy derived from ERC-8421. Where the node and the policy disagree,
        Adversyn produces a structured finding. Where it cannot tell, it says so.
      </p>

      <Callout kind="warn" title="Status: early">
        Adversyn was built at ETHGlobal Mumbai. The generate → execute → observe → analyze → report loop works end to end against the
        public alt-mempool devnet. Minimization, differential testing and trace-based rules are not built yet. Read{" "}
        <Ext href={repoFile("docs/LIMITATIONS.md")}>the known limitations</Ext> before trusting a result.
      </Callout>

      <H2>Background: frame transactions and alternative mempools</H2>
      <p>
        An EIP-8141 <strong>Frame Transaction</strong> is a sequence of frames. Each frame has a <strong>mode</strong> (
        <code>VERIFY</code>, <code>DEFAULT</code> or <code>SENDER</code>), a target, gas limits, value, data and flags. <code>VERIFY</code>{" "}
        frames run validation logic and approve execution, payment or both. The leading frames that establish who is authorised and who
        pays form the <strong>validation prefix</strong>; the remaining frames are the body.
      </p>
      <p>
        Because validation is programmable, a mempool cannot simply check a signature and a balance. ERC-8421 defines an{" "}
        <strong>alternative mempool</strong> with admission rules: which prefix shapes are allowed, which flags are forbidden, how much gas
        validation may use per entity, and more. The <strong>sidecar</strong> is the component that implements those rules and accepts
        transactions over JSON-RPC via <code>eth_sendFrameTransaction</code>.
      </p>
      <p>
        <strong>Admission</strong> is the sidecar's decision to accept a transaction into its pool. It is not the same as inclusion in a
        block. A rejection comes back as error text, and that text is the main signal Adversyn works with.
      </p>

      <H2>What Adversyn tests</H2>
      <ul>
        <li>Whether a sidecar rejects transactions that violate the structural ERC-8421 rules the policy encodes, at the right stage.</li>
        <li>Whether it admits transactions the policy expects to be valid.</li>
        <li>Behaviour at boundaries: gas limits, frame order, missing or duplicated frames, approve scopes and the atomic-batch flag.</li>
        <li>Whether the node's stated reason matches the rule the policy expected to be violated.</li>
      </ul>

      <H2>What it does not test</H2>
      <ul>
        <li>
          Opcode, storage, calling, creation, reputation, lifecycle and local rules (<code>OPCODES-*</code>, <code>STORAGE-*</code>,{" "}
          <code>CALLING-*</code>, <code>CREATION-010</code>, <code>REPUTATION-*</code>, <code>LIFECYCLE-*</code>, <code>LOCAL-*</code>). They
          are listed as unevaluated on every prediction.
        </li>
        <li>EIP-8141's own constraints. The policy encodes ERC-8421 only.</li>
        <li>Anything needing stake, a deployed paymaster or wallet, or an expiry verifier. Those scenarios are skipped with a reason.</li>
        <li>Smart contracts in general. Adversyn is not a contract scanner, a mempool, an explorer or an EVM.</li>
      </ul>

      <H2>Who it is for</H2>
      <p>
        Alternative mempool developers and operators, transaction-infrastructure teams (bundlers, relayers, gateways), protocol engineers
        working on ERC-8421 and EIP-8141, and security auditors examining transaction-validation infrastructure.
      </p>

      <H2>The workflow</H2>
      <T
        head={["Stage", "What happens", "Where"]}
        rows={[
          ["Simulate", "Predict the verdict from the pinned policy, offline", <Link to="/docs/policy">Policy & rules</Link>],
          ["Attack", "Generate deterministic variants of seed scenarios", <Link to="/docs/mutation">Mutation engine</Link>],
          ["Execute", "Compile, sign, submit with eth_sendFrameTransaction", <Link to="/docs/execution">Execution</Link>],
          ["Observe", "Record outcome, reason text, hash, raw exchange", <Link to="/docs/execution">Execution</Link>],
          ["Analyze", "Compare prediction and observation, stage-aware", <Link to="/docs/findings">Findings & reports</Link>],
          ["Prove", "Write results.json, findings.json, report.md", <Link to="/docs/findings">Findings & reports</Link>],
        ]}
      />

      <H2>Terminology</H2>
      <dl className="defs">
        {[
          ["Scenario", "A YAML description of one Frame Transaction: frames, roles, limits, flags, stake, and optionally the expected verdict."],
          ["Seed / mutant", "A seed is a scenario used as input to adversyn mutate. A mutant is a generated variant with a provenance block."],
          ["Policy", "The versioned ERC-8421 rule set in @adversyn/policy, pinned to erc-8421@74a868cd."],
          ["Prediction", "What the policy expects: verdict, violated rule IDs, and the rules it does not evaluate. Never an observation."],
          ["Observation", "What the node did: admitted (with hash), rejected (with text), or error. Facts only."],
          ["Stage", "How far the node got: static, solvency, validation, admitted, other, error (or skipped)."],
          ["Result", "The analyzer's judgement per scenario: PASS, FINDING, INCONCLUSIVE or ERROR."],
          ["Finding", "A structured mismatch with class, status, severity, fingerprint and the full observation. A candidate, not a confirmed bug."],
          ["Lead", "Behaviour worth investigating that the policy cannot judge, e.g. a rule clause it does not evaluate."],
        ].map(([t, d]) => (
          <div key={t}>
            <dt>{t}</dt>
            <dd>{d}</dd>
          </div>
        ))}
      </dl>

      <H2>Next steps</H2>
      <div className="link-grid">
        <LinkCard to="/docs/installation" title="Installation">
          Requirements, clone, install and verify.
        </LinkCard>
        <LinkCard to="/docs/quickstart" title="Quickstart">
          From a fresh checkout to your first evidence.
        </LinkCard>
        <LinkCard to="/docs/cli" title="CLI reference">
          Every command and option.
        </LinkCard>
        <LinkCard to="/docs/findings" title="Findings & reports">
          How to read results without over-reading them.
        </LinkCard>
      </div>
    </DocsLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Installation                                                       */
/* ------------------------------------------------------------------ */

export function Installation() {
  return (
    <DocsLayout page={docPage("installation")} source="package.json">
      <Callout kind="info" title="No published package">
        Adversyn is not published to npm. You run it from a clone of the repository. There is no build step: the CLI runs TypeScript
        directly through <code>tsx</code>.
      </Callout>

      <H2>Requirements</H2>
      <T
        head={["Requirement", "Version", "Notes"]}
        rows={[
          ["Node.js", "22 or newer", "Developed and tested on v24.7.0"],
          ["pnpm", "10.x", <>The workspace and lockfile use pnpm (10.20.0). See <Ext href="https://pnpm.io/installation">pnpm.io/installation</Ext></>],
          ["git", "any", "To clone the repository"],
          ["Network access", "—", <>Only for <code>adversyn run</code>. Tests and <code>adversyn mutate</code> are fully offline</>],
        ]}
      />
      <TerminalBlock session={S.VERSIONS} title="check versions" compact />

      <H2>Clone and install</H2>
      <TerminalBlock session={S.INSTALL} title="setup" />
      <p>
        This installs the nine workspace packages under <code>packages/</code> together with their dependencies: <code>commander</code>,{" "}
        <code>zod</code>, <code>yaml</code>, <code>viem</code> and <Ext href={HEGOTA_SUPPORT_URL}>@forshtat/hegota-support</Ext> for frame
        construction, signing and the wire format.
      </p>

      <H2>Verify the setup</H2>
      <p>The test suite runs entirely offline. It needs no devnet, no keys and no funds.</p>
      <TerminalBlock session={S.TEST} title="pnpm test" />
      <p>
        Type-check the workspace with <code>pnpm typecheck</code>. Then confirm the CLI starts:
      </p>
      <TerminalBlock session={S.HELP} title="pnpm adversyn --help" />

      <H2>How the CLI is invoked</H2>
      <p>
        <code>pnpm adversyn</code> is a script in the root <code>package.json</code> that runs <code>tsx packages/cli/src/index.ts</code>.
        Every command in these docs is run from the repository root. Pass <code>-s</code> (<code>pnpm -s adversyn …</code>) to hide pnpm's
        own script banner.
      </p>
      <CodeBlock code={`"scripts": {\n  "typecheck": "tsc --noEmit -p tsconfig.json",\n  "test": "vitest run",\n  "adversyn": "tsx packages/cli/src/index.ts"\n}`} lang="json" filename="package.json" href={repoFile("package.json")} />

      <H2>Environment variables</H2>
      <T
        head={["Variable", "Required", "Purpose"]}
        rows={[
          [<code>ADVERSYN_PRIVATE_KEY</code>, "No", <>A 0x-prefixed key for a funded, throwaway devnet account. Without it, each scenario gets a fresh unfunded key. See <Link to="/docs/configuration#keys-and-funding">Keys and funding</Link></>],
        ]}
      />
      <p>There are no other environment variables. The CLI does not read a <code>.env</code> file; export the variable in your shell.</p>

      <H2>External services</H2>
      <ul>
        <li>
          <strong>Target sidecar.</strong> By default <code>{DEVNET_RPC}</code>, the public ERC-8421 workshop devnet (chain 1337). You can
          point Adversyn at any compatible sidecar with <code>--rpc</code> and <code>--chain-id</code>.
        </li>
        <li>
          <strong>Explorer.</strong> <Ext href={EXPLORER_URL}>{EXPLORER_URL}</Ext> shows admitted transactions on that devnet. Adversyn does not
          call it; you use it to inspect hashes.
        </li>
      </ul>

      <H2>Repository layout</H2>
      <CodeBlock
        lang="text"
        filename="adversyn/"
        href={REPO_URL}
        code={`packages/
  core/        shared schemas: Scenario, Observation, Finding, Report; canonical hashing; fingerprints
  protocol/    scenario → signed wire transaction (wraps @forshtat/hegota-support)
  policy/      versioned ERC-8421 rule evaluators and predict()
  scenarios/   YAML loader
  mutation/    deterministic scenario mutation (adversyn mutate)
  executor/    submit to a sidecar and record an Observation
  analyzer/    node reason text → rule attribution; compare prediction vs observation
  reporter/    JSON and Markdown reports
  cli/         adversyn run, adversyn mutate
  testkit/     fixtures, including real captured node rejections
scenarios/examples/    14 example scenarios
scenarios/generated/   24 committed mutants + manifest.json
docs/evidence/         raw run files from the public devnet
tests/                 cross-package tests
apps/site/             this website`}
      />
      <Next to="/docs/quickstart">Continue to the Quickstart</Next>
    </DocsLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Quickstart                                                         */
/* ------------------------------------------------------------------ */

export function Quickstart() {
  return (
    <DocsLayout page={docPage("quickstart")} source="README.md">
      <p>
        This tutorial takes you from a fresh checkout to a mutant executed against a live node, and the evidence it leaves behind. It takes
        about ten minutes. Steps 1, 2 and 5 are offline. Steps 3 and 6 submit a handful of transactions to the public devnet using
        throwaway keys.
      </p>
      <Callout kind="warn" title="About the outputs below">
        Offline outputs are verbatim. Devnet outputs are representative: they use the node wording recorded on 2026-11-06. The public
        devnet is shared and changes; your run may differ, and that difference is itself information.
      </Callout>

      <ol className="steps">
        <Step title="Set up the development environment">
          <p>Clone the repository, install dependencies and run the offline test suite.</p>
          <TerminalBlock session={`${S.INSTALL}\n${S.TEST}`} title="setup" />
          <Look>
            <ul>
              <li>All 17 test files and 131 tests pass. Nothing touched the network.</li>
            </ul>
          </Look>
          <Next to="/docs/installation">Installation details</Next>
        </Step>

        <Step title="Configure the target">
          <p>
            The default target is the public devnet, so no configuration is needed for this tutorial. Check the defaults the CLI will use:
          </p>
          <TerminalBlock session={S.RUN_HELP} title="defaults" />
          <p>
            To use your own sidecar, add <code>--rpc &lt;url&gt; --chain-id &lt;n&gt;</code> to every <code>run</code> command. No key is
            needed: without <code>ADVERSYN_PRIVATE_KEY</code>, Adversyn generates a fresh throwaway key per scenario.
          </p>
          <Look>
            <ul>
              <li>
                <code>--rpc</code> defaults to <code>{DEVNET_RPC}</code> and <code>--chain-id</code> to <code>1337</code>.
              </li>
              <li>
                <code>--delay</code> defaults to 300 ms between submissions. Keep it on shared infrastructure.
              </li>
            </ul>
          </Look>
          <Next to="/docs/configuration">Configuration reference</Next>
        </Step>

        <Step title="Run a baseline">
          <p>Run one valid scenario and two scenarios that each break one structural rule.</p>
          <TerminalBlock session={S.RUN_STRUCTURAL} title="pnpm adversyn run" />
          <Look>
            <ul>
              <li>
                <code>[static]</code>: the node rejected before checking balances, and <code>node said:</code> shows its exact wording.
              </li>
              <li>
                <code>valid-self-verify</code> stops at <code>[solvency]</code>. The throwaway key has no funds, so the node checked the
                structural rules, then refused to go further. That still counts as PASS for those rules, and the note says what was not
                exercised.
              </li>
            </ul>
          </Look>
          <Next to="/docs/cli#adversyn-run">adversyn run reference</Next>
        </Step>

        <Step title="Understand the result">
          <p>Each run writes three files. The Markdown report is the quickest to read:</p>
          <TerminalBlock session={`$ cat out/run-<timestamp>/report.md\n${quickReport.trimEnd()}`} title="report.md" caption="Rendered by @adversyn/reporter from the run above." />
          <Look>
            <ul>
              <li>
                <strong>Predicted</strong> comes from the policy; <strong>Observed</strong> comes from the node. They are never mixed.
              </li>
              <li>
                <strong>Stage</strong> tells you how far the node got, and therefore which rules the result actually says anything about.
              </li>
            </ul>
          </Look>
          <Next to="/docs/findings">Interpreting findings and reports</Next>
        </Step>

        <Step title="Generate adversarial mutations">
          <p>
            Generate variants of <code>valid-self-verify</code> with the <code>atomic-flag</code> operator. This is offline; nothing is
            sent. Fixing <code>--now</code> makes the output reproducible byte for byte.
          </p>
          <TerminalBlock session={`${S.MUTATE_ATOMIC}\n$ ls out/mutants/scenarios\nvalid-self-verify.atomic-flag.8f8946c4.yaml\nvalid-self-verify.atomic-flag.9172d677.yaml`} title="pnpm adversyn mutate" />
          <CodeBlock code={FILES.mutantFirst} lang="yaml" filename="out/mutants/scenarios/valid-self-verify.atomic-flag.9172d677.yaml" href={repoFile(PATHS.mutantFirst)} maxHeight={360} />
          <Look>
            <ul>
              <li>
                <code>provenance</code> records the parent, the operator, the exact field changed, and the before and after values.
              </li>
              <li>
                There is no <code>expect</code> block. Mutants never inherit the parent's expectation; the prediction is in{" "}
                <code>manifest.json</code>.
              </li>
              <li>The same two files are committed under <code>scenarios/generated/</code>, which is how you can check determinism.</li>
            </ul>
          </Look>
          <Next to="/docs/mutation">Mutation engine</Next>
        </Step>

        <Step title="Execute against the target">
          <p>Send the mutant that puts the atomic flag on frame 0, inside the validation prefix:</p>
          <TerminalBlock
            session={S.RUN_MUTANT_PREFIX.replace("scenarios/generated/scenarios", "out/mutants/scenarios")}
            title="pnpm adversyn run"
            caption="Verdict, stage and node wording as recorded on 2026-11-06 (docs/evidence/mutants/mutant-run-2c)."
          />
          <Look>
            <ul>
              <li>The policy predicted reject for PREFIX-040 and the node rejected for PREFIX-040 at the static stage: PASS.</li>
              <li>
                The other mutant (flag on the last frame) has only been run with a funded key. Its result is in{" "}
                <Link to="/examples/adversarial">the adversarial example</Link>.
              </li>
            </ul>
          </Look>
          <Next to="/docs/execution">Execution</Next>
        </Step>

        <Step title="Inspect the finding and evidence">
          <p>
            <code>results.json</code> holds every entry with predicted and observed verdicts, stage and notes. <code>findings.json</code>{" "}
            holds findings only, each with the full observation; for this run it is <code>[]</code>.
          </p>
          <CodeBlock code={RESULT_2C} lang="json" filename="docs/evidence/mutants/mutant-run-2c/results.json" href={repoFile("docs/evidence/mutants/mutant-run-2c/results.json")} />
          <Look>
            <ul>
              <li>
                <code>meta.policy</code> and <code>meta.target</code> pin what this result is relative to.
              </li>
              <li>
                When a finding exists, its <code>fingerprint</code> stays the same across runs for the same policy, scenario and verdicts, so
                you can deduplicate.
              </li>
            </ul>
          </Look>
          <Next to="/examples/evidence">A real finding, field by field</Next>
        </Step>
      </ol>

      <H2>Where next</H2>
      <div className="link-grid">
        <LinkCard to="/docs/scenarios" title="Write your own scenario">
          The schema, and how a scenario compiles.
        </LinkCard>
        <LinkCard to="/docs/configuration" title="Point it at your sidecar">
          RPC, chain id, profile and keys.
        </LinkCard>
      </div>
    </DocsLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Configuration                                                      */
/* ------------------------------------------------------------------ */

export function Configuration() {
  return (
    <DocsLayout page={docPage("configuration")} source="packages/cli/src/index.ts">
      <p>
        Adversyn has no configuration file. Everything is set per command with flags, one optional environment variable, and the scenario
        files themselves.
      </p>

      <H2>Overview</H2>
      <T
        head={["Setting", "How", "Default"]}
        rows={[
          ["Target endpoint", <code>--rpc &lt;url&gt;</code>, <code>{DEVNET_RPC}</code>],
          ["Chain id", <code>--chain-id &lt;n&gt;</code>, <code>1337</code>],
          ["Encoding profile", <code>--profile &lt;name&gt;</code>, <code>{DEFAULT_PROFILE}</code>],
          ["Sender key", <code>ADVERSYN_PRIVATE_KEY</code>, "fresh throwaway key per scenario"],
          ["Pacing", <code>--delay &lt;ms&gt;</code>, "300"],
          ["Scenario directory", <code>[dir]</code>, <code>scenarios/examples</code>],
          ["Scenario selection", <code>--only &lt;ids&gt;</code>, "all in the directory"],
          ["Report directory", <code>--out &lt;dir&gt;</code>, <code>out/run-&lt;timestamp&gt;</code>],
          ["CI gating", <code>--fail-on-finding</code>, "off (exit 0)"],
          ["Policy", "fixed", <code>erc-8421-static:erc-8421@74a868cd</code>],
        ]}
      />

      <H2>Target endpoint</H2>
      <p>
        <code>--rpc</code> is the sidecar's JSON-RPC URL. It must implement <code>eth_sendFrameTransaction</code> and, for funded runs,{" "}
        <code>eth_getTransactionCount</code>. <code>--chain-id</code> must match the target, because it is part of the signed transaction.
      </p>
      <TerminalBlock
        session={`# the public ERC-8421 devnet (default)\n$ pnpm adversyn run\n# a local sidecar (workshop example values; not tested by the project)\n$ pnpm adversyn run --rpc http://localhost:14337/rpc/ --chain-id 9`}
        title="targets"
      />

      <H2>Encoding profile</H2>
      <p>
        <code>--profile</code> selects the <Ext href={HEGOTA_SUPPORT_URL}>hegota-support</Ext> profile used to build and sign frames: flag
        bits, approve-scope encoding and the wire format. The default, <code>{DEFAULT_PROFILE}</code>, matches the public devnet. Change it
        only if your target tracks a different EIP-8141 revision.
      </p>

      <H2>Policy profile</H2>
      <p>
        There is one policy, <code>erc-8421-static</code>, pinned to <code>erc-8421@74a868cd</code>. It is not selectable from the CLI;
        changing the pin is an explicit code change in <code>packages/policy</code> that also rewrites provenance in generated scenarios.
        See <Link to="/docs/policy">Policy & rules</Link>.
      </p>

      <H2>Keys and funding</H2>
      <p>
        Without <code>ADVERSYN_PRIVATE_KEY</code>, each scenario is signed with a newly generated key and nonce 0. That key holds nothing,
        so the node stops at its solvency check. This is enough to test the structural rules (PREFIX-010, PREFIX-040, PREFIX-050,
        BUDGET-010) and is the recommended default.
      </p>
      <p>
        To reach later stages, export a key for a <strong>funded throwaway devnet account</strong>. Adversyn then derives the sender
        address and reads its nonce from the node before each submission.
      </p>
      <TerminalBlock session={`$ export ADVERSYN_PRIVATE_KEY=<throwaway-devnet-key>\n$ pnpm adversyn run --only valid-self-verify`} title="funded run" />
      <Callout kind="warn" title="Never use a real key">
        Use a key created for the devnet and nothing else. Never use a key that controls mainnet funds, never commit it, and never paste
        it into a scenario file. Adversyn has no faucet or funding automation; fund the account on the network you target.
      </Callout>

      <H2>Scenario selection and pacing</H2>
      <p>
        <code>[dir]</code> picks a directory (every <code>.yaml</code>/<code>.yml</code> file in it is loaded). <code>--only</code> takes a
        comma-separated list of scenario ids. An id that does not exist is silently ignored, so a typo can produce a run with 0 scenarios.
      </p>
      <p>
        <code>--delay</code> pauses between submissions (skipped scenarios do not wait). Keep the default or higher on shared
        infrastructure.
      </p>

      <H2>Output</H2>
      <p>
        Reports go to <code>out/run-&lt;ISO timestamp&gt;/</code> unless <code>--out</code> is given. <code>out/</code> is in{" "}
        <code>.gitignore</code>. To keep evidence, copy a run folder somewhere tracked, as the project does under{" "}
        <Ext href={repoTree("docs/evidence")}>docs/evidence/</Ext>.
      </p>

      <H2>Mutation settings</H2>
      <T
        head={["Option", "Effect"]}
        wrap
        rows={[
          [<code>--operators</code>, "Comma-separated operator ids, applied in registry order. Default: all six."],
          [<code>--max</code>, "Stop after n emitted scenarios. Early seeds and operators fill the budget first."],
          [<code>--now</code>, "Unix seconds for time-dependent rules (PREFIX-080). Fix it for reproducible output."],
          [<><code>--out</code> / <code>--overwrite</code></>, "Output directory, default out/mutants. Refuses to overwrite unless told to."],
        ]}
      />
      <Next to="/docs/cli">Full CLI reference</Next>
    </DocsLayout>
  );
}
