import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// The site imports real files from the repository (scenarios, evidence) with `?raw`,
// so the documentation always shows what is actually committed.
const repoRoot = path.resolve(import.meta.dirname, "../..");

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@repo": repoRoot } },
  server: { fs: { allow: [repoRoot] } },
});
