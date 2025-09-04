// https://docs.expo.dev/guides/using-eslint/
const tanstackQueryConfig = require("@tanstack/eslint-plugin-query");
const { defineConfig } = require("eslint/config");
const drizzleConfig = require("eslint-plugin-drizzle");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");
const tseslintConfig = require("typescript-eslint");

module.exports = defineConfig([
  tseslintConfig.configs.recommended,
  expoConfig,
  eslintPluginPrettierRecommended,
  tanstackQueryConfig.configs["flat/recommended"],
  /* Drizzle ESLint Config */
  {
    plugins: { drizzle: drizzleConfig },
    rules: {
      ...drizzleConfig.configs.recommended.rules,
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
  },
  /* TypeScript Eslint Config */
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/array-type": ["warn", { default: "array-simple" }],
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  /* Other Rule Overrides */
  {
    rules: {
      "import/no-cycle": ["error"],
      "import/no-named-as-default-member": "off",
      "import/order": "off",

      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
  /* Ignored directories & files */
  {
    ignores: [
      "dist/*",
      "eslint.config.js",
      "expo-env.d.ts",
      "metro.config.js",
      "src/db/drizzle",
    ],
  },
]);
