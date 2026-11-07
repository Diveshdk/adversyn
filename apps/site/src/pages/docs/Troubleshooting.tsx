import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { DocsLayout, H2 } from "../../components/DocsLayout";
import { docPage, Ext } from "../../components/DocBits";
import { TerminalBlock } from "../../components/TerminalBlock";
import { repoFile } from "../../content/facts";
import * as S from "../../content/sessions";

function Issue({ title, symptom, cause, fix }: { title: string; symptom: ReactNode; cause: ReactNode; fix: ReactNode }) {
  return (
    <section>
      <H2>{title}</H2>
      {symptom}
      <p>
        <strong>Cause.</strong> {cause}
      </p>
      <p>
        <strong>Fix.</strong> {fix}
      </p>
    </section>
  );
}

export function Troubleshooting() {
  return (
    <DocsLayout page={docPage("troubleshooting")} source="docs/DEMO.md">
      <p>Every message on this page is real CLI output or text recorded from the public devnet.</p>

      <Issue
        title="Target endpoint unavailable"
        symptom={<TerminalBlock session={S.RUN_UNREACHABLE} title="RPC_UNREACHABLE" />}
        cause={
          <>
            The executor could not reach <code>--rpc</code>. The observation is recorded as <code>error</code> and the result as ERROR, never as
            a rejection. Skipped scenarios still appear because they never needed the network.
          </>
        }
        fix={
          <>
            Check the URL (including any trailing <code>/rpc</code> path), your network, and that the sidecar is up. The exit code is still 0,
            so in CI combine with a check on the summary or use saved evidence.
          </>
        }
      />

      <Issue
        title="Local development network not running"
        symptom={
          <p>
            Same output as above with a <code>localhost</code> URL, e.g. <code>Cannot reach http://localhost:14337/rpc/: fetch failed</code>.
          </p>
        }
        cause={<>Adversyn does not start or manage a sidecar or devnet. It only connects to one.</>}
        fix={
          <>
            Start your sidecar first, confirm it answers JSON-RPC, then pass both <code>--rpc</code> and <code>--chain-id</code>; a chain id
            mismatch produces a signature the node will not accept.
          </>
        }
      />

      <Issue
        title="Insufficient development funds"
        symptom={
          <TerminalBlock
            session={`PASS         valid-self-verify  [solvency]
             node stopped at the solvency check, so static rules passed; later rules (opcodes, storage, ...) were not exercised
INCONCLUSIVE invalid-stray-default-frame  [solvency]
             node stopped at the solvency check; PREFIX-010, PREFIX-120 depends on simulation or frame classification and may not have been evaluated yet. Re-run with a funded key (ADVERSYN_PRIVATE_KEY).`}
            title="solvency stage"
            caption="Recorded 2026-11-06 03:58 UTC (docs/evidence/budget-drift/fifth)."
          />
        }
        cause={
          <>
            Throwaway keys hold nothing, so the node replies that the payer has 0 wei. This is expected and is how structural rules are tested
            safely.
          </>
        }
        fix={
          <>
            Nothing, if you only need structural rules. To reach later stages, export a funded throwaway devnet key as{" "}
            <code>ADVERSYN_PRIVATE_KEY</code>. See <Link to="/docs/configuration#keys-and-funding">Keys and funding</Link>.
          </>
        }
      />

      <Issue
        title="Invalid scenario"
        symptom={<TerminalBlock session={S.INVALID_SCENARIO} title="schema error" />}
        cause={
          <>
            A file failed YAML parsing or the zod schema. The run stops before any submission and exits 1. A duplicated id produces{" "}
            <code>Error: duplicate scenario id "…" in &lt;file&gt; and &lt;file&gt;</code>.
          </>
        }
        fix={
          <>
            Read the <code>path</code> and <code>message</code> of each issue. Common ones: uppercase in <code>id</code>, an empty{" "}
            <code>frames</code> list, numbers written as strings for <code>limits</code>, or <code>value</code> written as a number instead of a
            decimal string. See <Link to="/docs/scenarios#schema">the schema</Link>.
          </>
        }
      />

      <Issue
        title="Transaction compilation refused"
        symptom={
          <TerminalBlock
            session={`INCONCLUSIVE invalid-expired-expiry  [skipped]
             skipped: frame 0: role expiry_verify needs verifier/factory details not mapped yet
INCONCLUSIVE valid-budget-staked  [skipped]
             skipped: needs staked entities; staking is not arranged by Adversyn`}
            title="skipped"
          />
        }
        cause={
          <>
            The scenario uses something the compiler or executor cannot arrange yet: <code>expiry_verify</code>, stake, a deployed contract,
            an invalid or missing signature, an explicit sender, or keyed nonces.
          </>
        }
        fix={
          <>
            This is reported honestly rather than approximated. Remove the unsupported feature, or keep the scenario as documentation of a gap.
            The full list of reasons is in <Link to="/docs/scenarios#from-scenario-to-frame-transaction">Scenarios</Link>.
          </>
        }
      />

      <Issue
        title="Target rejected for an unrecognised reason"
        symptom={<TerminalBlock session={S.RUN_MUTANT_LAST.split("\nwrote:")[0]!} title="stage other" />}
        cause={
          <>
            The node's text matches no pattern in <code>reasons.ts</code>. If the policy predicted accept, this is a low-severity{" "}
            <code>no-oracle</code> finding; if both rejected, it is INCONCLUSIVE.
          </>
        }
        fix={
          <>
            Read the <code>node said:</code> text in <code>report.md</code> or <code>findings.json</code> and look it up in EIP-8141 and
            ERC-8421. If it corresponds to a rule, add a dated pattern to{" "}
            <Ext href={repoFile("packages/analyzer/src/reasons.ts")}>reasons.ts</Ext>. If the rule is missing from the policy, that is a policy
            gap, as in this recorded case.
          </>
        }
      />

      <Issue
        title="Results changed between runs"
        symptom={
          <TerminalBlock
            session={`# 03:58 UTC
PASS         boundary-budget-97201  [static]
# 15:08 UTC, same scenario, same code
FINDING      boundary-budget-97201  [solvency]
             Node's static checks passed a transaction the policy rejects (BUDGET-010)`}
            title="budget drift"
            caption="Both recorded 2026-11-06 (docs/evidence/budget-drift)."
          />
        }
        cause={<>The public devnet is shared and was restarted without verification gas limits that day. Gateways also keep admission reports in memory and may restart.</>}
        fix={
          <>
            Quote behaviour with dates, keep run folders, and confirm configuration changes with the maintainers before calling a change a
            regression. See <Ext href={repoFile("docs/evidence/budget-drift/README.md")}>the budget-drift notes</Ext>.
          </>
        }
      />

      <Issue
        title="Missing evidence"
        symptom={<TerminalBlock session={`$ pnpm adversyn run --only invalid-atomc-in-prefix\ntarget ${"https://altmempoolgateway.forshtat.com/rpc"} (chain 1337), 0 scenarios\nsender: fresh throwaway key per scenario\n\n0 scenarios: 0 pass, 0 findings, 0 inconclusive/skipped, 0 errors`} title="typo in --only" />}
        cause={
          <>
            <code>run --only</code> silently ignores ids that do not exist, so a typo produces an empty run. Other gaps: rejected transactions
            have no hash; passing entries keep the node's text only in their notes; the explorer shows admission reports only while the
            gateway keeps them in memory.
          </>
        }
        fix={
          <>
            Check the scenario count in the first line. Use <code>--out</code> with a meaningful folder name and copy folders you want to keep
            out of the git-ignored <code>out/</code>. Capture explorer pages promptly for admitted hashes.
          </>
        }
      />

      <Issue
        title="mutate refuses to write"
        symptom={<TerminalBlock session={`${S.MUTATE_EXISTS}\n${S.MUTATE_UNKNOWN_SEED}`} title="mutate errors" />}
        cause={<>Files from a previous run exist in <code>--out</code>, or a seed id in <code>--only</code> does not exist (unlike <code>run</code>, <code>mutate</code> treats this as an error).</>}
        fix={
          <>
            Use a new <code>--out</code> directory (preferred) or pass <code>--overwrite</code>, which replaces only the files it writes. Check
            seed ids against <code>scenarios/examples</code>.
          </>
        }
      />

      <Issue
        title="CI passes despite findings"
        symptom={<p>The run prints findings but the job is green.</p>}
        cause={<>By default <code>run</code> exits 0 whatever the results.</>}
        fix={
          <>
            Add <code>--fail-on-finding</code>. It exits 1 when at least one finding is produced. ERROR and INCONCLUSIVE results do not trigger
            it.
          </>
        }
      />
    </DocsLayout>
  );
}
