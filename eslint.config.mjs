// ESLint 9 flat config — migrated from .eslintrc.cjs (eslint 8.56 + ts-eslint 6)
// per FU-ESLINT-9-MIGRATION (nexus handoff 2026-05-27 §2 H3, mirroring
// nexusm-mcp-server PR #16 c. 2026-05-27).
//
// Equivalent rules to the prior .eslintrc.cjs — no behavioural intent change,
// only the config format and package versions changed:
//   - `eslint:recommended`              → `js.configs.recommended`
//   - `plugin:@typescript-eslint/recommended` → `tseslint.configs.recommended`
//   - `parserOptions.ecmaVersion: 2020` + `sourceType: module` preserved
//   - `env.node + env.es2020`           → `globals.node` (es2020 globals are
//     implicit from ecmaVersion in flat config)
//   - 3 custom rules carry through verbatim (no-unused-vars argsIgnorePattern,
//     explicit-function-return-type off, no-explicit-any warn)
//   - `ignorePatterns` → top-level `{ ignores }` block

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      // Add varsIgnorePattern alongside argsIgnorePattern: legacy v6 config only
      // covered function args, but src/services/context.ts uses the
      // destructure-and-drop `_depth` pattern (intentionally unused after
      // separating from rest), which requires the vars side of the rule too.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
