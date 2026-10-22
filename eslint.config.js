// https://docs.expo.dev/guides/using-eslint/
/* global __dirname -- eslint lints this CommonJS config file itself; Node provides __dirname. */
const fs = require('fs');
const path = require('path');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

// Architecture boundaries. Imports only go "down": app -> features -> ui | api | lib | theme.
const sharedLayers = ['./src/ui', './src/api', './src/lib', './src/theme'];

// One zone per feature: a feature may import only from itself, never from another feature.
const featuresDir = path.join(__dirname, 'src/features');
const features = fs.existsSync(featuresDir)
  ? fs.readdirSync(featuresDir).filter((name) => fs.statSync(path.join(featuresDir, name)).isDirectory())
  : [];
const crossFeatureZones = features.map((name) => ({
  target: `./src/features/${name}`,
  from: './src/features',
  except: [`./${name}`],
  message: 'Features must not import other features. Move shared code down to ui / lib / api.',
}));

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    rules: {
      'import/no-cycle': 'error',
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: sharedLayers,
              from: ['./src/features', './src/app'],
              message: 'Shared layers (ui, api, lib, theme) must not depend on features or routes.',
            },
            {
              target: './src/features',
              from: './src/app',
              message: 'Features must not import route files.',
            },
            ...crossFeatureZones,
          ],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*'],
              message: "Import a feature through its public API: '@/features/<name>'.",
            },
          ],
        },
      ],
    },
  },
  {
    // jest.mock factories are hoisted above imports, so they must load modules with require().
    files: ['**/*.test.ts', '**/*.test.tsx', 'src/test-utils/**'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    ignores: ['dist/*'],
  },
]);
