// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

/** @type {import('eslint').Linter.Config[]} */
const config = [{
  ignores: [
    'node_modules/**',
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '*.config.js',
    '*.config.ts',
  ],
}, ...storybook.configs["flat/recommended"]];

export default config;
