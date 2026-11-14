import js from '@eslint/js';
import importX from 'eslint-plugin-import-x';
import jsdoc from 'eslint-plugin-jsdoc';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'coverage/', 'node_modules/', '*.config.{js,mjs}', '.commitlintrc.js'] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  jsdoc.configs['flat/contents-typescript-error'],
  jsdoc.configs['flat/logical-typescript-error'],
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'import-x': importX, 'simple-import-sort': simpleImportSort },
    rules: {
      eqeqeq: 'error',
      'guard-for-in': 'error',
      'no-console': ['error', { allow: ['debug', 'info', 'time', 'timeEnd', 'trace'] }],
      'object-shorthand': 'error',
      'no-warning-comments': 'warn',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      // conflicts with no-non-null-assertion (strict preset), which wins
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
      // `import x = require()` is used for `export =` modules like joi
      '@typescript-eslint/no-require-imports': ['error', { allowAsImport: true }],
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-default-export': 'error',
      'import-x/no-duplicates': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      // DTO-style classes that only carry decorators are the point of this library
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
    },
  },
  {
    // Tests poke at untyped metadata and use async callbacks for uniformity
    files: ['test/**/*.ts'],
    rules: {
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      'preserve-caught-error': 'off',
      '@typescript-eslint/no-extraneous-class': [
        'error',
        { allowWithDecorator: true, allowEmpty: true },
      ],
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  prettierRecommended,
);
