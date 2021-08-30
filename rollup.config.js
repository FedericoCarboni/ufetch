import { terser } from 'rollup-plugin-terser';
import { transform } from './build/rollup.js';
import replace from '@rollup/plugin-replace';
// import tscc from '@tscc/rollup-plugin-tscc';
import crypto from 'crypto';
import fs from 'fs';

const terserPlugin = terser({
  ecma: 5,
  ie8: true,
  safari10: true,
  keep_classnames: false,
  keep_fnames: false,
  compress: {
    unsafe: true,
    arguments: true,
    hoist_funs: true,
    hoist_props: true,
    hoist_vars: true,
    keep_fargs: false,
    negate_iife: true,
    pure_getters: true,
    passes: 12,
    sequences: 400,
    comparisons: false,
    typeofs: false,
  },
  mangle: {
    safari10: true,
    properties: {
      regex: /^_/,
    },
    // reserved: ['Headers', 'Request', 'Response'],
  },
  format: {
    max_line_len: 1000,
  },
});

const vbarrayb = fs.readFileSync('src/internal/vbarray.vbs');
const sha512 = 'sha512-' + crypto.createHash('sha512').update(vbarrayb).digest().toString('base64');
const vbarray = vbarrayb.toString('utf-8');

/** @type {import('rollup').RollupOptions[]} */
const config = [
  {
    input: 'src/ufetch.js',
    output: [
      {
        file: 'dist/ufetch.umd.js',
        format: 'umd',
        name: 'ufetch',
        esModule: false,
      }
    ],
    plugins: [
      {
        name: 'ufetch',
        transform,
      },
      terserPlugin,
      replace({
        values: {
          'VBARRAY_SCRIPT': JSON.stringify(vbarray),
        },
        delimiters: ['', ''],
        preventAssignment: true,
      }),
    ],
  },
  {
    input: ['src/ufetch.js'],
    output: [
      {
        dir: 'dist',
        format: 'es',
        minifyInternalExports: false,
        chunkFileNames: '[name].js'
      }
    ],
    plugins: [
      {
        name: 'ufetch',
        transform,
      },
      // terserPlugin,
      replace({
        values: {
          'VBARRAY_SCRIPT': JSON.stringify(vbarray),
        },
        delimiters: ['', ''],
        preventAssignment: true,
      }),
    ],
  },
  {
    input: ['src/internal/url/URL.js'],
    output: [
      {
        dir: 'dist',
        format: 'umd',
        // minifyInternalExports: false,
        chunkFileNames: '[name].js',
        name: 'url',
      }
    ],
    plugins: [
      {
        name: 'url',
        transform,
      },
      // terserPlugin,
      // replace({
      //   values: {
      //     'VBARRAY_SCRIPT': JSON.stringify(vbarray),
      //   },
      //   delimiters: ['', ''],
      //   preventAssignment: true,
      // }),
    ],
  },
];

export default config;
