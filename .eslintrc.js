'use strict';

/** @type {import('eslint').Linter.Config} */
const config = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    'eslint:recommended',

    'plugin:es/restrict-to-es3',

    'plugin:import/errors',
    'plugin:import/warnings',
  ],
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
  rules: {
    // src/* is written in ES3 but uses modules
    'es/no-modules': 'off',
    // We use TypeScript for type checking
    'no-undef': 'off',
    // Require file extensions
    'import/extensions': ['error', 'always'],
    // Ban default exports since they have worse interop with CommonJS/UMD
    'import/no-default-export': 'error',
    // Force lines to be 80 or less characters, long lines are hard to read
    // allow long strings that can't easily be broken down into smaller segments
    'max-len': ['error', { code: 80, ignoreStrings: true, ignoreUrls: true }],
    'semi': 'error',        // Must use semicolons
    'camelcase': 'error',   // Identifiers must be camelcase
    'eol-last': 'error',    // Files must have a last empty line
    'eqeqeq': 'error',      // Ban == and !=
    'no-eval': 'error',     // Ban eval()
    'no-new-func': 'error', // Ban Function()

    // 'no-restricted-syntax': ['error', {
    //   selector: 'BinaryExpression[operator="%"]',
    //   message: 'Use bitwise operations instead of %'
    // }],
    'operator-linebreak': ['error'],
    'no-unused-vars': ['error', {
      varsIgnorePattern: '^_',
      argsIgnorePattern: '^_'
    }],
    'no-param-reassign': 'error',  // Parameters must not be reassigned
    // Must use single quotes, except for escaping '
    'quotes': ['warn', 'single', { avoidEscape: true }],
    // Anonymous functions must have a space function () {}, named functions
    // mustn't have a space between the name of the function and the
    // parenthesis.
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
    }],
    // Comments must use a space after // or /*
    'spaced-comment': ['error', 'always', {
      // Comments recognized by build tools are the only exception
      exceptions: ['@__NOINLINE__', '@__INLINE__', '@__PURE__'],
      // TypeScript XML directives use triple slashes
      markers: ['/'],
    }],
    // Parenthesis are required with the new operator new Class()
    'new-parens': 'error',
    // $ should not be used in variable, function, constructor names, but it is
    // allowed to prefix non-standard/extension properties or methods added to
    // native objects or polyfills.
    'id-match': ['error', '^\\$?\\$?[a-zA-Z0-9_]*$'],
    'id-denylist': [
      'error',
      // Disallow poor quality names and identifiers that could be confused with
      // other environments (i.e. Node.js).
      '_', '__', '$',
      'exports', 'Exports',
      'require', 'Require',
      'module', 'Module',
      'eval', 'arguments',
    ],
    'one-var': ['error', 'never'],
    'es/no-promise': 'off',
  },
  ignorePatterns: [
    'build/**/*.js',
    '.eslintrc.js',
    'karma.conf.js',
    'rollup.config.js',
  ],
  root: true,
};

module.exports = config;
