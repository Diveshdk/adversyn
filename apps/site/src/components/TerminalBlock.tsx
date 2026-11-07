import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { CopyButton } from "./CopyButton";
import { highlightShell } from "./highlight";

/**
 * A terminal session is plain text, exactly as the CLI prints it:
 *   "$ cmd"  → a command (highlighted, and what the copy button copies)
 *   "# text" → a comment
 *   anything else → output, styled by what Adversyn prints (PASS / FINDING / node said: ...)
 */
export interface TerminalTab {
  label: string;
  session: string;
  caption?: ReactNode;
}

interface Props {
  session?: string;
  tabs?: TerminalTab[];
  title?: string;
  caption?: ReactNode;
  footer?: ReactNode;
  animate?: boolean;
  className?: string;
  /** Visually compact: for one-line commands inside docs. */
  compact?: boolean;
  /** Always wrap long lines, even on phones (default: wrap on desktop, scroll on phones). */
  wrap?: boolean;
}

const RESULT = /^(PASS|FINDING|INCONCLUSIVE|ERROR)(\s+)(\S+)(\s+)(\[[a-z]+\])?(.*)$/;

function OutputLine({ text }: { text: string }) {
  const r = RESULT.exec(text);
  if (r) {
    const kind = r[1]!.toLowerCase();
    return (
      <>
        <span className={`t-res t-res--${kind}`}>{r[1]}</span>
        {r[2]}
        <span className="t-id">{r[3]}</span>
        {r[4]}
        {r[5] && <span className="t-stage">{r[5]}</span>}
        {r[6]}
      </>
    );
  }
  const said = /^(\s*)(node said:)(.*)$/.exec(text);
  if (said) {
    return (
      <>
        {said[1]}
        <span className="t-dim">{said[2]}</span>
        <span className="t-quote">{said[3]}</span>
      </>
    );
  }
  const check = /^(\s*)([✓✗→])(.*)$/.exec(text);
  if (check) {
    const cls = check[2] === "✓" ? "t-ok" : check[2] === "✗" ? "t-err" : "t-acc";
    return (
      <>
        {check[1]}
        <span className={cls}>{check[2]}</span>
        {check[3]}
      </>
    );
  }
  return <>{text}</>;
}

function lineClass(text: string): string {
  if (/^\s*$/.test(text)) return "tl tl-blank";
  if (/^(error:|Error:)/.test(text)) return "tl tl-err";
  if (/^\d+ scenarios: /.test(text)) return "tl tl-sum";
  if (/^\s+(skipped:|admitted, tx hash)/.test(text)) return "tl tl-note";
  if (/^(wrote|target |sender:|These are offline|run them with|Usage:|Options:|Commands:|Arguments:)/.test(text)) return "tl tl-meta";
  if (/^\s{2,}\S/.test(text)) return "tl tl-sub";
  return "tl";
}

function Session({ session, animate }: { session: string; animate?: boolean }) {
  const lines = session.replace(/\n$/, "").split("\n");
  // A line following a command that ends in " \" is a shell continuation of that command.
  const cont = lines.map((_, i) => {
    for (let j = i - 1; j >= 0; j--) {
      const prev = lines[j]!;
      if (!prev.endsWith(" \\")) return false;
      if (prev.startsWith("$ ")) return true;
    }
    return false;
  });
  return (
    <pre className="term-pre">
      <code>
        {lines.map((line, i) => {
          const anim = animate ? ({ "--i": i } as CSSProperties) : {};
          // Wrapped text continues under the line's own indentation, not at the left edge.
          const lead = /^ */.exec(line)![0].length;
          const style: CSSProperties | undefined =
            lead >= 2 ? { ...anim, paddingLeft: `${lead}ch`, textIndent: `-${lead}ch` } : animate ? anim : undefined;
          if (cont[i]) {
            return (
              <span key={i} className="tl tl-cmd tl-cont" style={style}>
                {highlightShell(line)}
              </span>
            );
          }
          if (line.startsWith("$ ")) {
            return (
              <span key={i} className="tl tl-cmd" style={style}>
                <span className="t-prompt" aria-hidden="true">
                  $
                </span>{" "}
                {highlightShell(line.slice(2))}
              </span>
            );
          }
          if (line.startsWith("# ")) {
            return (
              <span key={i} className="tl tl-com" style={style}>
                {line}
              </span>
            );
          }
          return (
            <span key={i} className={lineClass(line)} style={style}>
              <OutputLine text={line} />
            </span>
          );
        })}
      </code>
    </pre>
  );
}

export function commandsOf(session: string): string {
  const cmds: string[] = [];
  let open = false;
  for (const l of session.split("\n")) {
    if (l.startsWith("$ ")) cmds.push(l.slice(2));
    else if (open) cmds[cmds.length - 1] += "\n" + l;
    else continue;
    open = l.endsWith(" \\");
  }
  return cmds.length ? cmds.join("\n") : session;
}

export function TerminalBlock({ session, tabs, title, caption, footer, animate, className, compact, wrap }: Props) {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const current = tabs ? tabs[active]! : { label: "", session: session ?? "", caption };
  const copyText = commandsOf(current.session);
  const hasCmd = current.session.split("\n").some((l) => l.startsWith("$ "));

  const onKey = (e: React.KeyboardEvent) => {
    if (!tabs) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const n = (active + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
      setActive(n);
      document.getElementById(`${baseId}-tab-${n}`)?.focus();
    }
  };

  return (
    <figure className={`term${compact ? " term--compact" : ""}${animate ? " term--animate" : ""}${wrap ? " term--wrap" : ""} ${className ?? ""}`}>
      <div className="term-bar">
        <span className="term-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        {tabs ? (
          <div className="term-tabs" role="tablist" aria-label={title ?? "Terminal examples"} onKeyDown={onKey}>
            {tabs.map((t, i) => (
              <button
                key={t.label}
                id={`${baseId}-tab-${i}`}
                role="tab"
                type="button"
                aria-selected={i === active}
                aria-controls={`${baseId}-panel`}
                tabIndex={i === active ? 0 : -1}
                className={`term-tab${i === active ? " is-active" : ""}`}
                onClick={() => setActive(i)}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : (
          <span className="term-title">{title ?? "Terminal"}</span>
        )}
        <span className="term-spacer" />
        <CopyButton text={copyText} label={hasCmd ? "Copy" : "Copy output"} />
      </div>
      <div
        className="term-body"
        id={`${baseId}-panel`}
        role={tabs ? "tabpanel" : undefined}
        aria-labelledby={tabs ? `${baseId}-tab-${active}` : undefined}
        tabIndex={0}
        key={active}
      >
        <Session session={current.session} animate={animate} />
        {footer}
      </div>
      {(current.caption ?? caption) && <figcaption className="term-caption">{current.caption ?? caption}</figcaption>}
    </figure>
  );
}
