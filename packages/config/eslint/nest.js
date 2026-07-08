import base from "./base.js";

/** ESLint config for NestJS (Node) apps. */
export default [
  ...base,
  {
    rules: {
      "@typescript-eslint/no-extraneous-class": "off",
      "@typescript-eslint/interface-name-prefix": "off",
    },
  },
];
