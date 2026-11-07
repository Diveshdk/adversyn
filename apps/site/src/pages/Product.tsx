import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLink, Badge, SectionHead } from "../components/Chrome";
import { TX_A, TX_B, explorerTx, repoFile, repoTree, short } from "../content/facts";

type Status = "available" | "partial" | "planned";

const MATRIX: { t: string; d: string; s: Status }[] = [
  { t: "Declarative scenarios", d: "YAML schema validated with zod; 14 example scenarios and 24 committed generated mutants.", s: "available" },
  { t: "ERC-8421 policy evaluation", d: "Seven structural rules (PREFIX-010/020/040/050/080/120, BUDGET-010) pinned to erc-8421@74a868cd; every other rule family listed as unevaluated.", s: "available" },
  { t: "Frame Transaction compiler", d: "self_verify, only_verify and pay approve scopes; signing via viem and hegota-support. expiry_verify, keyed nonces, invalid signatures and explicit senders are refused with a reason.", s: "available" },
  { t: "Mutation engine", d: "Six deterministic operators with provenance, offline compile check and per-case prediction.", s: "available" },
  { t: "Execution against any sidecar", d: "Configurable RPC URL, chain id, hegota-support profile and pacing. Fresh throwaway key per scenario by default.", s: "available" },
  { t: "Stage-aware analysis", d: "Dated reason patterns, six stages, conservative comparison and fingerprinted findings.", s: "available" },
  { t: "Reports and CI gating", d: "results.json, findings.json, report.md; --fail-on-finding exits 1.", s: "available" },
  { t: "Funded runs", d: "Supported with your own throwaway key in ADVERSYN_PRIVATE_KEY. Needed to reach simulation-dependent rules; there is no funding automation.", s: "partial" },
  { t: "EIP-8141 constraints in the policy", d: "Not encoded. A generated mutant exposed this gap (atomic flag on the last frame).", s: "partial" },
  { t: "Stake, deployed contracts, expiry verifier", d: "Scenarios that need them are skipped with an explicit reason.", s: "planned" },
  { t: "Trace-based rules, differential testing", d: "Opcode/storage rules and canonical-vs-alternative mempool comparison are on the roadmap.", s: "planned" },
  { t: "Minimizer, replay bundles, dashboard", d: "Not started.", s: "planned" },
];

const BADGE: Record<Status, { k: "pass" | "inconclusive" | "neutral"; l: string }> = {
  available: { k: "pass", l: "available" },
  partial: { k: "inconclusive", l: "partial" },
  planned: { k: "neutral", l: "not built yet" },
};

export function Product() {
  useEffect(() => {
    document.title = "Product · Adversyn";
  }, []);
  return (
    <main id="main">
      <header className="page-head">
        <div className="container">
          <p className="eyebrow">Product overview</p>
          <h1>The testing and analysis layer around alt-mempool infrastructure.</h1>
          <p className="lede">
            Adversyn sends crafted EIP-8141 Frame Transactions to a real ERC-8421 alternative mempool sidecar, records exactly what the
            node says, and compares it with a versioned policy. Where the node and the policy disagree, it produces a structured finding.
            Where it cannot tell, it says so.
          </p>
        </div>
      </header>

      <section className="section section--tight">
        <div className="container split">
          <div>
            <p className="mini-title">What it is</p>
            <ul className="plain-list">
              <li>An adversarial conformance-testing suite for Frame Transaction admission.</li>
              <li>A versioned, inspectable policy derived from the ERC-8421 draft.</li>
              <li>A deterministic generator of boundary and ordering variants.</li>
              <li>An evidence recorder: what was sent, what came back, and when.</li>
              <li>A CLI you can run locally or in CI against any compatible sidecar.</li>
            </ul>
          </div>
          <div>
            <p className="mini-title">What it is not</p>
            <ul className="plain-list is-no">
              <li>A mempool, a sidecar, or a replacement for one.</li>
              <li>A block explorer or an EVM execution client.</li>
              <li>A generic smart-contract security scanner or auditor.</li>
              <li>A random fuzzer. Every mutation is deterministic and explained.</li>
              <li>A source of confirmed vulnerabilities. Findings are candidates until checked against the spec.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <SectionHead
            eyebrow="Capability status"
            title="What works today, and what does not yet."
            lede="Adversyn is early-stage, built at ETHGlobal Mumbai. The generate → execute → observe → analyze → report loop works end to end against the public devnet."
          />
          <div className="status">
            {MATRIX.map((m) => (
              <div className="status-row" key={m.t}>
                <h3>{m.t}</h3>
                <p>{m.d}</p>
                <Badge kind={BADGE[m.s].k}>{BADGE[m.s].l}</Badge>
              </div>
            ))}
          </div>
          <p className="compare-foot">
            Full list with open spec questions:{" "}
            <a href={repoFile("docs/LIMITATIONS.md")} target="_blank" rel="noreferrer">
              docs/LIMITATIONS.md
            </a>
            .
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead
            eyebrow="Evidence so far"
            title="What it has observed on a real node."
            lede="Everything here comes from the public ERC-8421 devnet (chain 1337) on 2026-11-06. A shared devnet can change under you, so behaviour is quoted with dates. Nothing here is a confirmed vulnerability."
          />
          <div className="evidence">
            <div className="ev">
              <Badge kind="pass">enforced</Badge>
              <h3>Three structural rules confirmed</h3>
              <p>PREFIX-010, PREFIX-040 and PREFIX-050 rejected at the static stage, with the node's wording captured for each.</p>
              <span className="mono">“frame 0 in validation prefix has ATOMIC_BATCH_FLAG set”</span>
              <ArrowLink to="/docs/policy">Policy & rules</ArrowLink>
            </div>
            <div className="ev">
              <Badge kind="finding">policy gap</Badge>
              <h3>A mutant found a gap in its own policy</h3>
              <p>
                Atomic flag on the last frame: predicted accept, rejected by the node. The constraint is from EIP-8141, which the policy
                does not encode yet. Documented as a follow-up, not a node bug.
              </p>
              <span className="mono">“Frame 1: atomic batch flag on last frame”</span>
              <ArrowLink to="/examples/adversarial">See the run</ArrowLink>
            </div>
            <div className="ev">
              <Badge kind="inconclusive">changed</Badge>
              <h3>A measurement that stopped reproducing</h3>
              <p>
                In the morning BUDGET-010 put the unstaked boundary at 97,200 (97,201 rejected). Later the maintainer restarted the devnet
                without gas limits. Both states are preserved as dated evidence.
              </p>
              <span className="mono">signature-verification cost 2800 (observed)</span>
              <ArrowLink to={repoFile("docs/evidence/budget-drift/README.md")}>Budget drift notes</ArrowLink>
            </div>
          </div>
          <div className="split" style={{ marginTop: 48 }}>
            <div className="prose">
              <p className="mini-title">Admitted transactions</p>
              <p>
                <code>valid-self-verify</code> was admitted with every rule in the sidecar's admission report passing:{" "}
                <a href={explorerTx(TX_A)} target="_blank" rel="noreferrer" className="mono">
                  {short(TX_A)}
                </a>
                . It was still pending when captured.
              </p>
              <p>
                <code>lead-deploy-not-deploying-sender</code> was admitted and seen on chain:{" "}
                <a href={explorerTx(TX_B)} target="_blank" rel="noreferrer" className="mono">
                  {short(TX_B)}
                </a>
                . Its first frame deploys nothing. PREFIX-020 says the deploy frame must deploy <code>tx.sender</code>, a clause the static
                policy does not evaluate, so it is reported as an open question, not a finding.
              </p>
            </div>
            <div className="prose">
              <p className="mini-title">Responsible use</p>
              <p>
                Adversyn submits real transactions to shared infrastructure. Use fresh throwaway keys, keep the default pacing between
                submissions, and do not run mass-invalidation or reputation-burning traffic against a shared devnet.
              </p>
              <p>If a run shows a node admitting something the specification forbids, report it to the maintainers before publishing it.</p>
              <p>
                <a href={repoTree("docs/evidence")} target="_blank" rel="noreferrer">
                  Browse all raw evidence →
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container cta-inner">
          <div>
            <h2>See how a scenario becomes evidence.</h2>
            <p>The pipeline walkthrough follows one transaction through all six stages, with the real artifact each stage produces.</p>
          </div>
          <div className="cta-actions">
            <Link to="/how-it-works" className="btn btn-primary">
              How It Works
            </Link>
            <Link to="/docs/quickstart" className="btn btn-secondary">
              Quickstart
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
