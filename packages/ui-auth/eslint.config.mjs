// packages/ui-auth/eslint.config.mjs
import base from "../eslint-config-custom/flat.mjs";

export default [
  ...base,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    settings: {
      react: { version: "detect" },
    },
  },
];
