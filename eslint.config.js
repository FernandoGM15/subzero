// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const boundariesModule = require('eslint-plugin-boundaries');
const boundaries = boundariesModule.default ?? boundariesModule;

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },

  // ─────────────────────────────────────────────────────────────
  // Architectural boundaries (see AGENTS.md)
  // Enforces the Feature-Sliced Design Lite layering.
  // ─────────────────────────────────────────────────────────────
  {
    files: ['src/**/*.ts'],
    plugins: { boundaries },
    settings: {
      // TypeScript-aware resolver so extensionless imports resolve to files
      // and `boundaries` can classify the dependency target.
      'import/resolver': {
        typescript: {
          project: ['tsconfig.json', 'tsconfig.app.json', 'tsconfig.spec.json'],
          noWarnOnMultipleProjects: true,
        },
      },
      'boundaries/elements': [
        { type: 'core', pattern: 'src/app/core/**' },
        { type: 'shared', pattern: 'src/app/shared/**' },
        { type: 'layout', pattern: 'src/app/layout/**' },
        {
          type: 'feature',
          pattern: 'src/app/features/*/**',
          capture: ['featureName'],
        },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message:
            'Boundary violated: "{{ from.element.type }}" is not allowed to import "{{ to.element.type }}". See AGENTS.md.',
          policies: [
            // NOTE: root files (app.ts, app.config.ts, app.routes.ts) are the
            // composition root and stay unclassified → unrestricted by design.
            // core → core, shared
            {
              from: { element: { type: 'core' } },
              allow: {
                to: { element: { types: { anyOf: ['core', 'shared'] } } },
              },
            },
            // shared → shared, core
            {
              from: { element: { type: 'shared' } },
              allow: {
                to: { element: { types: { anyOf: ['shared', 'core'] } } },
              },
            },
            // layout → layout, shared, core
            {
              from: { element: { type: 'layout' } },
              allow: {
                to: {
                  element: { types: { anyOf: ['layout', 'shared', 'core'] } },
                },
              },
            },
            // feature → shared, core
            {
              from: { element: { type: 'feature' } },
              allow: {
                to: { element: { types: { anyOf: ['shared', 'core'] } } },
              },
            },
            // feature → ONLY the same feature (no cross-feature imports)
            {
              from: { element: { type: 'feature' } },
              allow: {
                to: {
                  element: {
                    type: 'feature',
                    captured: {
                      featureName: '{{ from.element.captured.featureName }}',
                    },
                  },
                },
              },
            },
          ],
        },
      ],
    },
  },

  // domain/ purity: no Angular, no data-access, no ui (see AGENTS.md)
  {
    files: ['src/app/**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@angular/*', '**/data-access/**', '**/ui/**'],
              message: 'domain/ must stay pure: no Angular, no data-access, no ui imports.',
            },
          ],
        },
      ],
    },
  },
]);
