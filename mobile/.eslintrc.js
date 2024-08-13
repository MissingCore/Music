/** @type {import("eslint").Linter.Config} */
const config = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  plugins: ["@tanstack/query", "drizzle", "prettier"],
  extends: [
    "expo",
    "prettier",
    "plugin:@tanstack/eslint-plugin-query/recommended",
    "plugin:drizzle/recommended",
  ],
  rules: {
    "@typescript-eslint/array-type": ["warn", { default: "array-simple" }],
    "@typescript-eslint/consistent-type-exports": "error",
    "@typescript-eslint/consistent-type-imports": "error",
    // Note: you must disable the base rule as it can report incorrect errors
    "no-redeclare": "off",
    "@typescript-eslint/no-redeclare": [
      "error",
      { ignoreDeclarationMerge: true },
    ],
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "import/order": "off",
    "prettier/prettier": ["error", { endOfLine: "auto" }],
    // Ensures props and state inside functions are always up-to-date
    "react-hooks/exhaustive-deps": "warn",
    // Ensure that the rules only run on Drizzle instance instead of any
    // other instance of `.delete()` (ie: conflict with Sets).
    "drizzle/enforce-delete-with-where": [
      "error",
      { drizzleObjectName: ["db"] },
    ],
    "drizzle/enforce-update-with-where": [
      "error",
      { drizzleObjectName: ["db"] },
    ],
  },
  ignorePatterns: ["expo-env.d.ts", "metro.config.js", "src/db/drizzle"],
};

module.exports = config;
