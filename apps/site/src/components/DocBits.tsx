import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { DOC_PAGES } from "../content/docsNav";
import { H2 } from "./DocsLayout";

export function T({ head, rows, wrap }: { head: ReactNode[]; rows: ReactNode[][]; wrap?: boolean }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={wrap ? "wrap" : undefined}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="step">
      <H2>{title}</H2>
      {children}
    </li>
  );
}

export function Look({ title = "What to look for", children }: { title?: string; children: ReactNode }) {
  return (
    <div className="look">
      <p className="look-title">{title}</p>
      {children}
    </div>
  );
}

export function Next({ to, children }: { to: string; children: ReactNode }) {
  return (
    <p className="step-next">
      <Link to={to} className="arrow-link">
        {children} <span className="arrow">→</span>
      </Link>
    </p>
  );
}

export function LinkCard({ to, title, children }: { to: string; title: string; children: ReactNode }) {
  return (
    <Link to={to} className="link-card">
      <strong>{title}</strong>
      <span>{children}</span>
    </Link>
  );
}

export const docPage = (slug: string) => DOC_PAGES.find((p) => p.slug === slug)!;

export const Ext = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer">
    {children}
  </a>
);
