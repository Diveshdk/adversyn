import type { ReactNode } from "react";

type Rule = [RegExp, string | null];

function tokenize(src: string, rules: Rule[]): ReactNode[] {
  const out: ReactNode[] = [];
  let plain = "";
  let i = 0;
  let k = 0;
  const flush = () => {
    if (plain) out.push(plain);
    plain = "";
  };
  outer: while (i < src.length) {
    for (const [re, cls] of rules) {
      re.lastIndex = i;
      const m = re.exec(src);
      if (m && m.index === i && m[0].length > 0) {
        if (cls) {
          flush();
          out.push(
            <span key={k++} className={cls}>
              {m[0]}
            </span>,
          );
        } else plain += m[0];
        i += m[0].length;
        continue outer;
      }
    }
    plain += src[i++];
  }
  flush();
  return out;
}

const y = (s: string, f = "") => new RegExp(s, "y" + f);

const YAML: Rule[] = [
  [y("#.*"), "tk-com"],
  [y("[A-Za-z_][\\w.-]*(?=:(\\s|$))"), "tk-key"],
  [y('"[^"\\n]*"|\'[^\'\\n]*\''), "tk-str"],
  [y("\\b(true|false|null)\\b"), "tk-bool"],
  [y("0x[0-9a-fA-F]*"), "tk-num"],
  [y("[A-Za-z_][\\w-]*"), null],
  [y("(?<![\\w@.])-?\\d[\\d_]*(\\.\\d+)?(?![\\w@])"), "tk-num"],
  [y("[:\\[\\]{},]|-(?=\\s)"), "tk-pun"],
];

const JSON_RULES: Rule[] = [
  [y('"(?:[^"\\\\]|\\\\.)*"(?=\\s*:)'), "tk-key"],
  [y('"(?:[^"\\\\]|\\\\.)*"'), "tk-str"],
  [y("\\b(true|false|null)\\b"), "tk-bool"],
  [y("-?\\d+(\\.\\d+)?([eE][+-]?\\d+)?"), "tk-num"],
  [y("[{}\\[\\],:]"), "tk-pun"],
];

const TS: Rule[] = [
  [y("//.*|/\\*[\\s\\S]*?\\*/"), "tk-com"],
  [y('"(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'|`(?:[^`\\\\]|\\\\.)*`'), "tk-str"],
  [
    y(
      "\\b(import|from|export|const|let|var|function|return|if|else|type|interface|async|await|new|for|of|in|class|extends|implements|readonly|throw|try|catch)\\b",
    ),
    "tk-kw",
  ],
  [y("\\b(true|false|null|undefined)\\b"), "tk-bool"],
  [y("\\b[A-Z][A-Za-z0-9_]*\\b"), "tk-type"],
  [y("[A-Za-z_$][\\w$]*(?=\\()"), "tk-fn"],
  [y("[A-Za-z_$][\\w$]*"), null],
  [y("\\b\\d[\\d_]*n?\\b"), "tk-num"],
  [y("[{}()\\[\\];,.:=<>|&?!+*/-]"), "tk-pun"],
];

const MD: Rule[] = [
  [y("^#{1,6} .*", "m"), "tk-kw"],
  [y("`[^`\\n]*`"), "tk-str"],
  [y("\\*\\*[^*\\n]+\\*\\*"), "tk-key"],
  [y("\\|"), "tk-pun"],
  [y("^- ", "m"), "tk-pun"],
  [y("\\b(PASS|FINDING|INCONCLUSIVE|ERROR)\\b"), "tk-type"],
];

export type Lang = "yaml" | "json" | "ts" | "md" | "text";

export function highlight(src: string, lang: Lang): ReactNode[] {
  switch (lang) {
    case "yaml":
      return tokenize(src, YAML);
    case "json":
      return tokenize(src, JSON_RULES);
    case "ts":
      return tokenize(src, TS);
    case "md":
      return tokenize(src, MD);
    default:
      return [src];
  }
}

// ---- shell command highlighting (terminal) ----

const SHELL: Rule[] = [
  [y("#.*"), "sh-com"],
  [y("[A-Z_][A-Z0-9_]*=(?=\\S)"), "sh-env"],
  [y('"[^"]*"|\'[^\']*\''), "sh-str"],
  [y("(?<![\\w/.-])(pnpm|git|cd|node|corepack|cat|ls|export|jq|npx|tsx)(?![\\w/.-])"), "sh-bin"],
  [y("(?<![\\w/.-])adversyn(?![\\w/.-])"), "sh-bin"],
  [y("(?<=adversyn )(run|mutate|help)\\b"), "sh-sub"],
  [y("(?<=pnpm )(install|test|typecheck|dev|build|-s)\\b"), "sh-sub"],
  [y("(?<=\\s)--?[A-Za-z][\\w-]*"), "sh-flag"],
  [y("<[^>\\s]+>"), "sh-ph"],
  [y("[|&;>]"), "sh-op"],
];

export function highlightShell(cmd: string): ReactNode[] {
  return tokenize(cmd, SHELL);
}
