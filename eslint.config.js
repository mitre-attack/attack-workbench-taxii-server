import pluginJs from '@eslint/js';
import * as mdx from 'eslint-plugin-mdx';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['node_modules', 'dist'],
  },
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,

  // MDX file support (in the documentation)
  {
    files: ['**/*.mdx'],
    processor: mdx.processors.mdx,
  },
  {
    files: ['**/*.{md,mdx}'],
    plugins: {
      mdx,
    },
    rules: {
      'mdx/no-unused-expressions': 'error',
    },
  },
];
