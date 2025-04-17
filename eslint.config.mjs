// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    ignores: [
      'out/**',
      'dist/**',
      '**/*.d.ts',
      'webpack.config.js',
      'node_modules/**',
      '.vscode-test/**',
      '.vscode/**',
      '.git/**',
      '.gitignore',
      '.eslintignore',
      '.eslintrc.js',
      '.prettierrc',
      '.prettierignore',
      'README.md',
      'LICENSE',
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'tsconfig.dev.json',
      'tsconfig.prod.json',
      'tsconfig.test.json',
      'vscode-extension-quickstart.md',
    ],
  },
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // Custom rules
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          prefix: ['I'],
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
        },
      ],
    },
  }
);
