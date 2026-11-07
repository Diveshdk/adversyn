export interface DocPage {
  slug: string; // path under /docs ("" = /docs)
  title: string;
  description: string;
  keywords: string;
}

export interface DocGroup {
  title: string;
  pages: DocPage[];
}

export const DOC_GROUPS: DocGroup[] = [
  {
    title: "Getting started",
    pages: [
      { slug: "", title: "Introduction", description: "What Adversyn tests, what it does not, and the core terminology.", keywords: "overview alt mempool frame transaction eip-8141 erc-8421 terminology admission" },
      { slug: "installation", title: "Installation", description: "Requirements, cloning the repository and verifying the setup.", keywords: "install node pnpm clone setup requirements test" },
      { slug: "quickstart", title: "Quickstart", description: "Run a baseline, generate mutants, execute them and read the evidence.", keywords: "tutorial first run baseline mutate execute report steps" },
      { slug: "configuration", title: "Configuration", description: "Target endpoint, chain id, profile, keys, pacing and output.", keywords: "rpc chain-id profile ADVERSYN_PRIVATE_KEY env delay out funded local sidecar" },
    ],
  },
  {
    title: "Reference",
    pages: [
      { slug: "cli", title: "CLI reference", description: "Every command, argument, option and exit behaviour.", keywords: "run mutate options flags help exit code fail-on-finding only operators max now overwrite" },
      { slug: "scenarios", title: "Scenarios", description: "Scenario schema, loading, authoring and compilation to Frame Transactions.", keywords: "yaml schema frames role mode target limits atomicBatch expect hash compile" },
      { slug: "policy", title: "Policy & rules", description: "The seven evaluated ERC-8421 rules, the spec pin and what is not evaluated.", keywords: "prefix-010 prefix-040 prefix-050 budget-010 prefix-020 prefix-080 prefix-120 unevaluated pin 74a868cd predict" },
      { slug: "mutation", title: "Mutation engine", description: "The six operators, determinism, provenance and reproduction.", keywords: "gas-boundary frame-order frame-remove frame-duplicate role atomic-flag manifest provenance deterministic" },
      { slug: "execution", title: "Execution", description: "Compilation, submission, admission, rejection and key handling.", keywords: "eth_sendFrameTransaction submit observation tx hash funded throwaway key skipped solvency" },
      { slug: "findings", title: "Findings & reports", description: "Specification vs prediction vs observation, classifications and report files.", keywords: "pass finding inconclusive error stage fingerprint results.json findings.json report.md severity class" },
    ],
  },
  {
    title: "Help",
    pages: [
      { slug: "troubleshooting", title: "Troubleshooting", description: "Real failure modes and what to do about them.", keywords: "error unreachable rpc invalid scenario skipped overwrite solvency unknown reason devnet changed" },
    ],
  },
];

export const DOC_PAGES: DocPage[] = DOC_GROUPS.flatMap((g) => g.pages);
export const docPath = (slug: string) => (slug ? `/docs/${slug}` : "/docs");
export const groupOf = (slug: string) => DOC_GROUPS.find((g) => g.pages.some((p) => p.slug === slug));
