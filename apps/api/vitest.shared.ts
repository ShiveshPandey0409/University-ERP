import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const here = dirname(fileURLToPath(import.meta.url));

export const workspaceAlias = {
  "@erp/shared": resolve(here, "../../packages/shared/src/index.ts"),
  "@erp/db": resolve(here, "../../packages/db/src/index.ts"),
};

/** Resolves NodeNext-style `./foo.js` specifiers to their `.ts` source so the
 * same imports work under both `tsc` (build) and Vitest (tests). */
export function resolveJsAsTs(): Plugin {
  return {
    name: "resolve-js-as-ts",
    enforce: "pre",
    resolveId(source, importer) {
      if (!importer || !source.startsWith(".") || !source.endsWith(".js")) return null;
      const candidate = resolve(dirname(importer), source.replace(/\.js$/, ".ts"));
      return existsSync(candidate) ? candidate : null;
    },
  };
}
