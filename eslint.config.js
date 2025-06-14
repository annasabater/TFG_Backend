// eslint.config.js
import parserTs from '@typescript-eslint/parser';
import eslintPluginTs from '@typescript-eslint/eslint-plugin';
import importPlugin, { rules } from 'eslint-plugin-import';

/** @type {import('eslint').FlatConfig[]} */
export default [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: parserTs,
      parserOptions: {
        tsconfigRootDir: process.cwd(),
        project: ['./tsconfig.json'],
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': eslintPluginTs,
      import: importPlugin
    },
    rules: {
      // Reglas TS recomendadas
      ...eslintPluginTs.configs.recommended.rules,
      // No any
      '@typescript-eslint/no-explicit-any': 'error',
      // No variables/const/imports sin usar
      '@typescript-eslint/no-unused-vars': ['error', {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true
      }],
      // Indentación con tabulaciones
      'indent': ['error', 'tab', { SwitchCase: 1 }],
      // Llaves sólo en bloques multi-línea
      'curly': ['error', 'multi-line'],
      // Siempre punto y coma
      'semi': ['error', 'always'],
      // Prohíbe console.log
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='console'][callee.property.name='log']",
          message: "No se permite console.log fuera de logginHandler.ts o server.ts"
        }
      ]
    }
  },
  {
    // Excepción console.log para logginghandler.ts y server.ts
    files: ['src/middleware/loggingHandler.ts','src/server.ts'],
    plugins: {
      '@typescript-eslint': eslintPluginTs,
      import: importPlugin
    },
    rules: {
      'no-restricted-syntax': 'off'
    }
  },
  {
    files: ['src/middleware/isOwner.ts'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off'
    }
  },
  {
    files: ['src/**/session_*.ts', 'src/server.ts', 'src/models/drone_models.ts'],
    rules: {
        '@typescript-eslint/no-explicit-any': 'off',
    }
  }
];
