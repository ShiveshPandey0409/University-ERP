import nest from "@erp/config/eslint/nest";

export default [
  ...nest,
  {
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
  },
];
