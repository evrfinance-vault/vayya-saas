module.exports = {
  root: true,
  extends: ["../../packages/eslint-config-custom/index.js"],
  parserOptions: { tsconfigRootDir: __dirname, project: "./tsconfig.json" },
};
