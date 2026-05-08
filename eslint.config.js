import js from '@eslint/js';
import {flatConfigs as importXConfigs} from 'eslint-plugin-import-x';
import prettier from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import {config, configs as tseslintConfigs} from 'typescript-eslint';

export default config(
  {ignores: ['lib/**', 'node_modules/**']},
  js.configs.recommended,
  tseslintConfigs.recommended,
  importXConfigs.recommended,
  importXConfigs.typescript,
  prettier,
  {
    languageOptions: {
      globals: globals.node
    },
    rules: {
      'prettier/prettier': 'error',
      'import-x/order': [
        'error',
        {
          groups: ['type', 'builtin', ['sibling', 'parent'], 'index', 'object'],
          'newlines-between': 'never',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true
          }
        }
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
);
