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
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "import/order": "off",
    "prettier/prettier": ["error", { endOfLine: "auto" }],
    // Ensures props and state inside functions are always up-to-date
    "react-hooks/exhaustive-deps": "warn",
  },
  ignorePatterns: ["expo-env.d.ts", "metro.config.js", "src/db/drizzle"],
};

module.exports = config;
