import js from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier"
import onlyWarn from "eslint-plugin-only-warn"
import turboPlugin from "eslint-plugin-turbo"
import tseslint from "typescript-eslint"

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
      // Allow single-line if statements without brackets
      curly: "off",
      "@typescript-eslint/brace-style": "off",
      // Enforce no semicolons
      "semi": ["error", "never"],
      // Enforce arrow function expressions when possible
      "arrow-body-style": ["error", "as-needed", { requireReturnForObjectLiteral: false }],
      // Prefer interfaces over types for object definitions
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      // Disable unsafe rules - we use Zod-first validation strategy instead
      // This aligns with ts-reset (JSON.parse/response.json return unknown) which requires runtime validation
      // See config/eslint/README.md for details and .cursor/rules/base/typescript.mdc for ts-reset documentation
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ["dist/**"],
  },
]
