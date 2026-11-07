import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { DOC_GROUPS, DOC_PAGES, docPath, groupOf, type DocPage } from "../content/docsNav";
import { repoFile } from "../content/facts";

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[`'’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) return textOf((node as { props: { children?: ReactNode } }).props.children);
  return "";
}

export function H2({ children, id }: { children: ReactNode; id?: string }) {
  const hid = id ?? slugify(textOf(children));
  return (
    <h2 id={hid} className="doc-h2">
      <a href={`#${hid}`} className="anchor" aria-hidden="true" tabIndex={-1}>
        #
      </a>
      {children}
    </h2>
  );
}

export function H3({ children, id }: { children: ReactNode; id?: string }) {
  const hid = id ?? slugify(textOf(children));
  return (
    <h3 id={hid} className="doc-h3">
      <a href={`#${hid}`} className="anchor" aria-hidden="true" tabIndex={-1}>
        #
      </a>
      {children}
    </h3>
  );
}

function Toc({ contentKey }: { contentKey: string }) {
  const [items, setItems] = useState<{ id: string; text: string; level: number }[]>([]);
  const [active, setActive] = useState("");

  useEffect(() => {
    const hs = Array.from(document.querySelectorAll<HTMLElement>(".doc-article h2[id], .doc-article h3[id]"));
    setItems(hs.map((h) => ({ id: h.id, text: (h.textContent ?? "").replace(/^#/, ""), level: h.tagName === "H2" ? 2 : 3 })));
    setActive(hs[0]?.id ?? "");
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-72px 0px -70% 0px" },
    );
    hs.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [contentKey]);

  if (items.length < 2) return null;
  return (
    <nav className="toc" aria-label="On this page">
      <p className="toc-title">On this page</p>
      <ul>
        {items.map((it) => (
          <li key={it.id} className={`toc-l${it.level}`}>
            <a href={`#${it.id}`} className={active === it.id ? "is-active" : ""}>
              {it.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="sidenav" aria-label="Documentation">
      {DOC_GROUPS.map((g) => (
        <div key={g.title} className="sidenav-group">
          <p className="sidenav-title">{g.title}</p>
          <ul>
            {g.pages.map((p) => (
              <li key={p.slug}>
                <NavLink to={docPath(p.slug)} end className={({ isActive }) => `sidenav-link${isActive ? " is-active" : ""}`} onClick={onNavigate}>
                  {p.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="sidenav-group">
        <p className="sidenav-title">Examples</p>
        <ul>
          <li>
            <NavLink to="/examples/baseline" className="sidenav-link" onClick={onNavigate}>
              Baseline test
            </NavLink>
          </li>
          <li>
            <NavLink to="/examples/adversarial" className="sidenav-link" onClick={onNavigate}>
              Adversarial test
            </NavLink>
          </li>
          <li>
            <NavLink to="/examples/evidence" className="sidenav-link" onClick={onNavigate}>
              Evidence report
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export function QuickNav({ hotkey = false }: { hotkey?: boolean }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const all = [
      ...DOC_PAGES.map((p) => ({ to: docPath(p.slug), title: p.title, desc: p.description, hay: `${p.title} ${p.description} ${p.keywords}`.toLowerCase(), group: groupOf(p.slug)?.title ?? "" })),
      { to: "/examples/baseline", title: "Example: baseline test", desc: "valid-self-verify admitted by the devnet sidecar", hay: "example baseline valid admitted", group: "Examples" },
      { to: "/examples/adversarial", title: "Example: adversarial test", desc: "Mutants of valid-self-verify against the node", hay: "example adversarial mutant atomic-flag", group: "Examples" },
      { to: "/examples/evidence", title: "Example: evidence report", desc: "A recorded report and finding, field by field", hay: "example evidence report finding fingerprint", group: "Examples" },
    ];
    return terms.length ? all.filter((r) => terms.every((t) => r.hay.includes(t))) : all;
  }, [q]);

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        opener.current = document.activeElement as HTMLElement;
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey]);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (open) {
      setQ("");
      setIdx(0);
      requestAnimationFrame(() => input.current?.focus());
    } else opener.current?.focus?.();
  }, [open]);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <>
      <button
        type="button"
        className="qn-trigger"
        onClick={(e) => {
          opener.current = e.currentTarget;
          setOpen(true);
        }}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span>Search docs</span>
        <kbd>⌘K</kbd>
      </button>
      {open &&
        createPortal(
        <div className="qn-backdrop" onMouseDown={() => setOpen(false)}>
          <div className="qn" role="dialog" aria-modal="true" aria-label="Search documentation" onMouseDown={(e) => e.stopPropagation()}>
            <input
              ref={input}
              className="qn-input"
              placeholder="Search pages, commands, rules…"
              value={q}
              aria-label="Search documentation"
              aria-controls="qn-results"
              aria-activedescendant={results[idx] ? `qn-${idx}` : undefined}
              onChange={(e) => {
                setQ(e.target.value);
                setIdx(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
                else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setIdx((i) => Math.min(i + 1, results.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setIdx((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter" && results[idx]) go(results[idx].to);
              }}
            />
            <ul className="qn-results" id="qn-results" role="listbox">
              {results.length === 0 && <li className="qn-empty">No matches. Try “gas”, “run”, or “PREFIX-040”.</li>}
              {results.map((r, i) => (
                <li
                  key={r.to}
                  id={`qn-${i}`}
                  role="option"
                  aria-selected={i === idx}
                  className={`qn-item${i === idx ? " is-active" : ""}`}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => go(r.to)}
                >
                  <span className="qn-group">{r.group}</span>
                  <span className="qn-title">{r.title}</span>
                  <span className="qn-desc">{r.desc}</span>
                </li>
              ))}
            </ul>
            <div className="qn-foot">
              <span>
                <kbd>↑</kbd>
                <kbd>↓</kbd> to move
              </span>
              <span>
                <kbd>↵</kbd> to open
              </span>
              <span>
                <kbd>esc</kbd> to close
              </span>
            </div>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}

interface Props {
  page: DocPage;
  children: ReactNode;
  /** Repository file this page is primarily derived from. */
  source?: string;
}

export function DocsLayout({ page, children, source }: Props) {
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  useEffect(() => setMenu(false), [loc.pathname]);
  useEffect(() => {
    document.title = `${page.title} · Adversyn Docs`;
  }, [page.title]);

  const i = DOC_PAGES.findIndex((p) => p.slug === page.slug);
  const prev = DOC_PAGES[i - 1];
  const next = DOC_PAGES[i + 1];
  const group = groupOf(page.slug);

  return (
    <div className="docs container-wide">
      <aside className="docs-side">
        <QuickNav hotkey />
        <SidebarNav />
      </aside>

      <div className="docs-mobilebar">
        <button type="button" className="docs-menu-btn" aria-expanded={menu} aria-controls="docs-drawer" onClick={() => setMenu((m) => !m)}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          {group?.title} <span aria-hidden="true">/</span> <strong>{page.title}</strong>
        </button>
        <QuickNav />
      </div>
      {menu && (
        <div className="docs-drawer" id="docs-drawer">
          <SidebarNav onNavigate={() => setMenu(false)} />
        </div>
      )}

      <main id="main" className="docs-main">
        <nav className="crumbs" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link to="/docs">Docs</Link>
            </li>
            <li>{group?.title}</li>
            <li aria-current="page">{page.title}</li>
          </ol>
        </nav>
        <article className="doc-article prose">
          <header className="doc-head">
            <h1>{page.title}</h1>
            <p className="doc-lede">{page.description}</p>
          </header>
          {children}
        </article>
        <div className="doc-meta">
          {source && (
            <a href={repoFile(source)} target="_blank" rel="noreferrer">
              Derived from <span className="mono">{source}</span> ↗
            </a>
          )}
        </div>
        <nav className="pager" aria-label="Previous and next page">
          {prev ? (
            <Link to={docPath(prev.slug)} className="pager-link">
              <span className="pager-dir">← Previous</span>
              <span className="pager-title">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={docPath(next.slug)} className="pager-link pager-next">
              <span className="pager-dir">Next →</span>
              <span className="pager-title">{next.title}</span>
            </Link>
          ) : (
            <Link to="/examples" className="pager-link pager-next">
              <span className="pager-dir">Next →</span>
              <span className="pager-title">Examples</span>
            </Link>
          )}
        </nav>
      </main>

      <aside className="docs-toc">
        <Toc contentKey={page.slug} />
      </aside>
    </div>
  );
}
