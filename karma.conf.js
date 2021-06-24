'use strict';
require = require("esm")(module);
const { transform } = require('./build/rollup');
const middleware = require('./build/middleware');
const replace = require('@rollup/plugin-replace');
const fs = require('fs');
const vbarray = fs.readFileSync('src/internal/vbarray.vbs').toString('utf-8');

/** @param {import('karma').Config} config */
function config(config) {
  config.set({
    frameworks: ['mocha', 'chai'],
    files: ['test/**/*.test.js'],
    reporters: ['progress'],
    port: 9876,
    colors: true,
    browsers: ['IE9'],
    autoWatch: true,
    preprocessors: {
      '**/*.test.js': ['rollup'],
    },
    middleware: ['custom'],
    customLaunchers: {
      IE9: {
        base: 'IE',
        'x-ua-compatible': 'IE=EmulateIE9',
        flags: ['-extoff'],
      },
      IE8: {
        base: 'IE',
        'x-ua-compatible': 'IE=EmulateIE8',
        flags: ['-extoff'],
      }
    },
    rollupPreprocessor: {
      plugins: [
        replace({
          values: {
            'VBARRAY_SCRIPT': JSON.stringify(vbarray),
          },
          delimiters: ['', ''],
          preventAssignment: true,
        }),
        {
          name: 'ufetch',
          transform,
        },
      ],
      output: {
        format: 'iife',
        name: 'ufetchTest',
        // sourcemap: 'inline',
        sourcemap: false,
      },
    },
    plugins: [
      require('karma-mocha'),
      require('karma-chai'),
      require('karma-rollup-preprocessor'),
      require('karma-ie-launcher'),
      { 'middleware:custom': ['factory', middleware] },
    ],
  });
};

module.exports = config;
