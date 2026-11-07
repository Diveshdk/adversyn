import type { ReactElement } from "react";
import { Introduction, Installation, Quickstart, Configuration } from "./GettingStarted";
import { CliReference, Scenarios, Policy, Mutation, Execution, Findings } from "./Reference";
import { Troubleshooting } from "./Troubleshooting";

export const DOCS_ROUTES: { path: string; element: ReactElement }[] = [
  { path: "docs", element: <Introduction /> },
  { path: "docs/installation", element: <Installation /> },
  { path: "docs/quickstart", element: <Quickstart /> },
  { path: "docs/configuration", element: <Configuration /> },
  { path: "docs/cli", element: <CliReference /> },
  { path: "docs/scenarios", element: <Scenarios /> },
  { path: "docs/policy", element: <Policy /> },
  { path: "docs/mutation", element: <Mutation /> },
  { path: "docs/execution", element: <Execution /> },
  { path: "docs/findings", element: <Findings /> },
  { path: "docs/troubleshooting", element: <Troubleshooting /> },
];
