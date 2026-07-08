import base from "./base.js";

/** ESLint config for Next.js apps. */
export default [
  ...base,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
