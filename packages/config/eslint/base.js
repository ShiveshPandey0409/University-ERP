import js from "@eslint/js";
import tseslint from "typescript-eslint";

/** Shared flat ESLint config for all TypeScript packages. */
export default tseslint.config(
  {
    ignores: ["dist/**", ".next/**", "node_modules/**", "coverage/**", "**/*.generated.*"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
