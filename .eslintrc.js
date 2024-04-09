/** @type {import("eslint").Linter.Config} */
const config = {
  root: true,
  extends: ["universe/native", "universe/shared/typescript-analysis"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "import/order": "off",
    "prettier/prettier": ["error", { endOfLine: "auto" }],
    // Ensures props and state inside functions are always up-to-date
    "react-hooks/exhaustive-deps": "warn",
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx", "*.d.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: { project: "./tsconfig.json" },
    },
  ],
  ignorePatterns: ["metro.config.js", "src/drizzle"],
};

module.exports = config;
