import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";
import { resolveJsAsTs, workspaceAlias } from "./vitest.shared.js";

// Unit tests. SWC provides decorator metadata (esbuild does not), which NestJS
// DI relies on.
export default defineConfig({
  resolve: { alias: workspaceAlias },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts"],
  },
  plugins: [
    resolveJsAsTs(),
    swc.vite({
      jsc: {
        target: "es2022",
        parser: { syntax: "typescript", decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
      },
    }),
  ],
});
