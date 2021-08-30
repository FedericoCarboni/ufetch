/// <reference path="vbarray.vbs.d.ts"/>

import { MAX_CALL_STACK_SIZE } from '../_inline.js';
import { Array, fromCharCode } from './intrinsics.js';
import { isActiveX } from './util.js';

if (isActiveX) {
  // VBARRAY_SCRIPT is replaced at build time with the contents of vbarray.vbs
  // execScript is run only once so there is no need to alias it.
  execScript(VBARRAY_SCRIPT, 'VBScript');
}

/**
 * Convert a VBScript Byte Array into a JavaScript ByteString. This function is
 * optimized for IE9, on my machine it averages ~26MiB/s.
 * @param vbarray {VBArray<u8>}
 * @returns {ByteString}
 */
export function toByteString(vbarray) {
  var str = ufetch_vbs_0(vbarray);
  var lastChar = ufetch_vbs_1(vbarray);
  var length = str.length;

  // Allocate a MAX_CALL_STACK_SIZE sized Array. This Array will be reused
  // throughout this function to avoid costly allocations and garbage
  // collections.
  /** @type {number[]} */
  var charCodes = Array(MAX_CALL_STACK_SIZE);
  var charCodeN = 0;
  var bs = '';

  for (var i = 0; i < length; i++) {
    var c = str.charCodeAt(i);
    charCodes[charCodeN++] = c & 0xff;
    charCodes[charCodeN++] = c >> 8;
    // Common trick among all functions using fromCharCode, reduce the number of
    // costly function calls by processing charCodes in batches.
    // charCodeN is always even
    if (charCodeN === MAX_CALL_STACK_SIZE) {
      bs += fromCharCode.apply(undefined, charCodes);
      charCodeN = 0;
    }
  }

  //
  if (charCodeN) {
    charCodes.length = charCodeN;
    bs += fromCharCode.apply(undefined, charCodes);
  }

  if (lastChar) {
    bs += lastChar;
  }

  return bs;
}
