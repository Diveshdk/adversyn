import { useEffect, useRef, useState } from "react";

export const WORKFLOW = [
  {
    n: "01",
    name: "Simulate",
    text: "Evaluate a scenario against the pinned ERC-8421 policy and establish the expected verdict. Static and offline: no EVM, no network.",
    artifact: "Prediction",
    detail: "verdict · violated · unevaluated",
    pkg: "@adversyn/policy",
    glyph: "simulate",
  },
  {
    n: "02",
    name: "Attack",
    text: "Generate deterministic mutations that probe validation boundaries: gas limits, frame order, roles, flags.",
    artifact: "manifest.json",
    detail: "mutant scenarios + provenance",
    pkg: "@adversyn/mutation",
    glyph: "attack",
  },
  {
    n: "03",
    name: "Execute",
    text: "Compile each scenario into a signed EIP-8141 Frame Transaction and submit it to the configured sidecar.",
    artifact: "eth_sendFrameTransaction",
    detail: "signed wire transaction",
    pkg: "@adversyn/protocol · executor",
    glyph: "execute",
  },
  {
    n: "04",
    name: "Observe",
    text: "Record what the node actually did: admitted with a hash, or rejected with its exact wording.",
    artifact: "Observation",
    detail: "outcome · reason text · raw reply",
    pkg: "@adversyn/executor",
    glyph: "observe",
  },
  {
    n: "05",
    name: "Analyze",
    text: "Compare prediction and observation, stage-aware. Separate agreement, divergence and what cannot be judged.",
    artifact: "ReportEntry",
    detail: "pass · finding · inconclusive · error",
    pkg: "@adversyn/analyzer",
    glyph: "analyze",
  },
  {
    n: "06",
    name: "Prove",
    text: "Write findings with stable fingerprints, scenario hashes and the raw node exchange, ready to reproduce.",
    artifact: "report.md",
    detail: "results.json · findings.json",
    pkg: "@adversyn/reporter",
    glyph: "prove",
  },
] as const;

function Glyph({ kind }: { kind: string }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "simulate":
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <rect x="7" y="9" width="26" height="22" rx="2" {...s} />
          <path d="M12 16h9M12 21h14M12 26h6" {...s} />
          <circle cx="28" cy="16" r="2" fill="currentColor" />
        </svg>
      );
    case "attack":
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <rect x="6" y="10" width="12" height="20" rx="1.5" {...s} />
          <rect x="22" y="10" width="12" height="20" rx="1.5" {...s} strokeDasharray="2.5 2.5" />
          <path d="M18 20h4" {...s} />
          <path d="M26 16h4M26 20h2M26 24h4" {...s} />
        </svg>
      );
    case "execute":
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <path d="M6 20h22" {...s} />
          <path d="M23 14l6 6-6 6" {...s} />
          <rect x="30" y="11" width="4" height="18" rx="1" {...s} />
        </svg>
      );
    case "observe":
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <path d="M5 20s5.5-9 15-9 15 9 15 9-5.5 9-15 9S5 20 5 20Z" {...s} />
          <circle cx="20" cy="20" r="4" {...s} />
        </svg>
      );
    case "analyze":
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <rect x="6" y="9" width="11" height="22" rx="1.5" {...s} />
          <rect x="23" y="9" width="11" height="22" rx="1.5" {...s} />
          <path d="M9 15h5M9 20h5M26 15h5M26 20h3" {...s} />
          <path d="M18.5 25h3" {...s} />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <path d="M11 6h13l6 6v22H11z" {...s} />
          <path d="M24 6v6h6" {...s} />
          <path d="M15.5 22.5l3 3 6-7" {...s} />
        </svg>
      );
  }
}

/** Six-stage process diagram. Highlights stage by stage once it scrolls into view. */
export function Workflow() {
  const ref = useRef<HTMLOListElement>(null);
  const [lit, setLit] = useState(-1);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setLit(WORKFLOW.length - 1);
      return;
    }
    let timer: number | undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        let i = 0;
        const step = () => {
          setLit(i);
          if (++i < WORKFLOW.length) timer = window.setTimeout(step, 180);
        };
        step();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <ol className="wf" ref={ref} aria-label="Adversyn workflow">
      {WORKFLOW.map((s, i) => (
        <li
          key={s.n}
          className={`wf-step${i <= lit ? " is-lit" : ""}${hover === i ? " is-hover" : ""}`}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
        >
          <div className="wf-rail" aria-hidden="true">
            <span className="wf-node" />
            {i < WORKFLOW.length - 1 && <span className="wf-line" />}
          </div>
          <div className="wf-content">
            <div className="wf-top">
              <span className="wf-num">{s.n}</span>
              <span className="wf-glyph">
                <Glyph kind={s.glyph} />
              </span>
            </div>
            <h3 className="wf-name">{s.name}</h3>
            <p className="wf-text">{s.text}</p>
            <div className="wf-out">
              <span className="wf-artifact">{s.artifact}</span>
              <span className="wf-detail">{s.detail}</span>
            </div>
            <span className="wf-pkg">{s.pkg}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
