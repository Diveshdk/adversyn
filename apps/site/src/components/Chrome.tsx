import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { DEVNET_RPC, EXPLORER_URL, HEGOTA_SUPPORT_URL, REPO_URL, repoFile } from "../content/facts";

export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="logo-mark">
      <rect width="32" height="32" rx="7" fill="var(--text)" />
      <path d="M9 22.5 16 9l7 13.5" fill="none" stroke="var(--bg)" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M11.6 17.5h8.8" stroke="#6E8BFF" strokeWidth="2.4" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Adversyn home">
      <LogoMark />
      <span className="logo-word">Adversyn</span>
    </Link>
  );
}

export function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.22 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

const NAV = [
  { to: "/product", label: "Product" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/docs", label: "Documentation" },
  { to: "/examples", label: "Examples" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    document.body.classList.toggle("no-scroll", open);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="nav">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className={`nav-inner ${loc.pathname.startsWith("/docs") ? "container-wide" : "container"}`}>
        <Logo />
        <nav className="nav-links" aria-label="Primary">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"} className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          <a className="nav-gh" href={REPO_URL} target="_blank" rel="noreferrer">
            <GitHubIcon />
            <span>GitHub</span>
          </a>
          <Link to="/docs/quickstart" className="btn btn-primary btn-sm">
            Get Started
          </Link>
          <button
            type="button"
            className="nav-burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
      <div id="mobile-menu" className={`nav-mobile${open ? " is-open" : ""}`} hidden={!open}>
        <nav aria-label="Mobile">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `nav-mobile-link${isActive ? " is-active" : ""}`}>
              {n.label}
            </NavLink>
          ))}
          <a className="nav-mobile-link" href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          <Link to="/docs/quickstart" className="btn btn-primary nav-mobile-cta">
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>
            Adversarial conformance testing for EIP-8141 Frame Transactions and ERC-8421 alternative mempools. Built at
            ETHGlobal Mumbai. Early-stage, open source.
          </p>
        </div>
        <div className="footer-col">
          <h2>Product</h2>
          <Link to="/product">Overview</Link>
          <Link to="/how-it-works">How It Works</Link>
          <Link to="/how-it-works#architecture">Architecture</Link>
          <Link to="/examples">Examples</Link>
        </div>
        <div className="footer-col">
          <h2>Documentation</h2>
          <Link to="/docs">Introduction</Link>
          <Link to="/docs/quickstart">Quickstart</Link>
          <Link to="/docs/cli">CLI reference</Link>
          <Link to="/docs/findings">Findings &amp; reports</Link>
          <Link to="/docs/troubleshooting">Troubleshooting</Link>
        </div>
        <div className="footer-col">
          <h2>References</h2>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub repository
          </a>
          <a href={repoFile("docs/LIMITATIONS.md")} target="_blank" rel="noreferrer">
            Known limitations
          </a>
          <a href={HEGOTA_SUPPORT_URL} target="_blank" rel="noreferrer">
            hegota-support
          </a>
          <a href={EXPLORER_URL} target="_blank" rel="noreferrer">
            Alt-mempool explorer
          </a>
        </div>
      </div>
      <div className="container footer-base">
        <span>© 2026 Divesh Kankani · MIT licence</span>
        <span className="mono">default target {DEVNET_RPC.replace("https://", "")}</span>
      </div>
    </footer>
  );
}

export function Badge({ kind, children }: { kind: "pass" | "finding" | "inconclusive" | "error" | "accent" | "neutral"; children: ReactNode }) {
  return <span className={`badge badge--${kind}`}>{children}</span>;
}

export function Callout({ kind = "note", title, children }: { kind?: "note" | "warn" | "info"; title?: string; children: ReactNode }) {
  return (
    <aside className={`callout callout--${kind}`}>
      {title && <p className="callout-title">{title}</p>}
      <div className="callout-body">{children}</div>
    </aside>
  );
}

export function ArrowLink({ to, children }: { to: string; children: ReactNode }) {
  const ext = /^https?:/.test(to);
  const inner = (
    <>
      {children}
      <span aria-hidden="true" className="arrow">
        {ext ? "↗" : "→"}
      </span>
    </>
  );
  return ext ? (
    <a className="arrow-link" href={to} target="_blank" rel="noreferrer">
      {inner}
    </a>
  ) : (
    <Link className="arrow-link" to={to}>
      {inner}
    </Link>
  );
}

export function SectionHead({ eyebrow, title, lede, id }: { eyebrow?: string; title: ReactNode; lede?: ReactNode; id?: string }) {
  return (
    <div className="section-head">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="section-title" id={id}>
        {title}
      </h2>
      {lede && <p className="section-lede">{lede}</p>}
    </div>
  );
}

/** Scroll to hash targets and to top on route change. */
export function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        requestAnimationFrame(() => el.scrollIntoView({ block: "start" }));
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
