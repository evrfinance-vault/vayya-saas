import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';
import { FlatCompat } from '@eslint/eslintrc';
import globals from 'globals';

// Convert legacy presets (plugin:xxx/recommended) to flat config
const compat = new FlatCompat({
	baseDirectory: new URL('.', import.meta.url).pathname,
});

export default [
	// 0) Ignore configs, build, caches
	{
		ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.*/**', '**/eslint.config.*', '**/*.config.*', '**/vite.config.*', '**/vitest.config.*'],
	},

	// 1) Base ESLint recs
	js.configs.recommended,

	// 2) Legacy plugin presets (converted)
	...compat.extends('plugin:react/recommended', 'plugin:react-hooks/recommended', 'plugin:import/recommended'),

	// 3) Global settings (applies everywhere)
	{
		settings: {
			react: { version: 'detect' },
		},
	},

	// 4) Project files (TS/JS) — enable TS project and set globals
	{
		files: ['**/*.{ts,tsx,js,jsx}'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				project: ['./tsconfig.json'],
				tsconfigRootDir: process.cwd(),
			},
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		plugins: {
			'@typescript-eslint': tsPlugin,
			react,
			'react-hooks': reactHooks,
			import: importPlugin,
		},
		settings: {
			'import/resolver': { typescript: true },
		},
		rules: {
			'no-empty': ['error', { allowEmptyCatch: true }],
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
			'react/react-in-jsx-scope': 'off',
			quotes: ['error', 'double', { avoidEscape: true }],
			'jsx-quotes': ['error', 'prefer-double'],
			semi: ['error', 'always'],
		},
	},

	// 5) Test files — don't require TS project; keep nice globals
	{
		files: ['**/*.test.*', '**/*.spec.*', '**/tests/**/*.*', '**/__tests__/**/*.*'],
		languageOptions: {
			parser: tsParser,
			parserOptions: { project: false },
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
	},

	// 6) Keep last to disable conflicting stylistic rules
	prettier,
];
