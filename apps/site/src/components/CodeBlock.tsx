import type { ReactNode } from "react";
import { CopyButton } from "./CopyButton";
import { highlight, type Lang } from "./highlight";

interface Props {
  code: string;
  lang?: Lang;
  filename?: string;
  /** Link to the file in the repository. */
  href?: string;
  caption?: ReactNode;
  maxHeight?: number;
}

const LANG_LABEL: Record<Lang, string> = { yaml: "YAML", json: "JSON", ts: "TypeScript", md: "Markdown", text: "Text" };

export function CodeBlock({ code, lang = "text", filename, href, caption, maxHeight }: Props) {
  const src = code.replace(/\n$/, "");
  return (
    <figure className="code">
      <div className="code-bar">
        <svg className="code-file-icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 1.5h5.5L13 5v9.5H4z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M9.5 1.5V5H13" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
        {filename ? (
          href ? (
            <a className="code-filename" href={href} target="_blank" rel="noreferrer">
              {filename}
            </a>
          ) : (
            <span className="code-filename">{filename}</span>
          )
        ) : (
          <span className="code-filename">{LANG_LABEL[lang]}</span>
        )}
        <span className="code-lang">{LANG_LABEL[lang]}</span>
        <CopyButton text={src} tone="light" />
      </div>
      <pre className="code-pre" style={maxHeight ? { maxHeight } : undefined} tabIndex={0}>
        <code>{highlight(src, lang)}</code>
      </pre>
      {caption && <figcaption className="code-caption">{caption}</figcaption>}
    </figure>
  );
}
