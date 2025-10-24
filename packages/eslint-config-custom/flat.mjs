import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-config-prettier";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";

const compat = new FlatCompat({
  baseDirectory: new URL(".", import.meta.url).pathname,
});

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/.prisma/**",
      "**/coverage/**",
      "**/.*/**",
      "**/eslint.config.*",
      "**/*.config.*",
      "**/vite.config.*",
      "**/vitest.config.*",
      "apps/**/src/generated/**",
      "apps/**/prisma/**",
      "src/generated/**",
      "prisma/**",
    ],
  },
  js.configs.recommended,
  ...compat.extends(
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:import/recommended",
  ),
  {
    settings: {
      react: { version: "detect" },
    },
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: ["./tsconfig.json"],
        tsconfigRootDir: process.cwd(),
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react,
      "react-hooks": reactHooks,
      import: importPlugin,
    },
    settings: {
      "import/resolver": { typescript: true },
    },
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": "off",
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "react/react-in-jsx-scope": "off",
      quotes: ["error", "double", { avoidEscape: true }],
      "jsx-quotes": ["error", "prefer-double"],
      semi: ["error", "always"],
    },
  },
  {
    files: [
      "**/*.test.*",
      "**/*.spec.*",
      "**/tests/**/*.*",
      "**/__tests__/**/*.*",
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: false },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  prettier,
];
