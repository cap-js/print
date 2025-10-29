import cds from "@sap/cds/eslint.config.mjs";

export default [
  ...cds,
  {
    files: ["**/*.js"],
    rules: {
      "no-await-in-loop": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["test/**"],
    rules: {
      "no-console": "off",
    },
  },
];
