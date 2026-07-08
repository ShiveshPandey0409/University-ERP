import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";
import { resolveJsAsTs, workspaceAlias } from "./vitest.shared.js";

// End-to-end tests against a real Postgres + Redis. globalSetup migrates and
// seeds a dedicated test database; test-env points the app at it.
export default defineConfig({
  resolve: { alias: workspaceAlias },
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.e2e-spec.ts"],
    setupFiles: ["./test/helpers/test-env.ts"],
    globalSetup: ["./test/helpers/global-setup.ts"],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
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
