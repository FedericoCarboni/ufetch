/// <reference path="vbarray.vbs.d.ts"/>

import { MAX_CALL_STACK_SIZE } from '../_inline.js';
import { Array, fromCharCode } from './intrinsics.js';
import { isActiveX } from './util.js';

if (isActiveX) {
  // VBARRAY_SCRIPT is replaced at build time with the contents of vbarray.vbs
  execScript(VBARRAY_SCRIPT, 'VBScript');
}

var EVERY_CHAR = /[\s\S]/g;

/**
 *
 * @param {string} s
 * @returns {string}
 */
function splitU16(s) {
  var c = s.charCodeAt(0);
  return fromCharCode(c & 0xff, c >> 8);
}

/**
 * @param {VBArray<u8>} vbarray
 * @returns {ByteString}
 */
export function toByteString(vbarray) {
  // This function is optimized for IE9, on my machine it averages ~26MiB/s.

  // var byteMapping = {};
  // for (var i = 0; i < 256; i++) {
  //  for (var j = 0; j < 256; j++) {
  //   byteMapping[String.fromCharCode(i + j * 256)] =
  //    String.fromCharCode(i) + String.fromCharCode(j);
  //   }
  // }
  // call into VBScript utility fns
  // var rawBytes = IEBinaryToArray_ByteStr(binary);
  // var lastChr = IEBinaryToArray_ByteStr_Last(binary);
  // return rawBytes.replace(/[\s\S]/g,
  //   function (match) { return byteMapping[match]; }) + lastChr;

  var cstr = ufetch_VBArrayToString(vbarray);
  var lastChar = ufetch_VBArrayToStringLastChar(vbarray);
  var length = cstr.length;

  // Allocate a MAX_CALL_STACK_SIZE sized Array. This Array will be reused
  // throughout this function to avoid costly allocations and garbage
  // collections.
  /** @type {number[]} */
  var charCodes = Array(MAX_CALL_STACK_SIZE);
  var charCodeN = 0;
  var bs = '';

  for (var i = 0; i < length; i++) {
    var c = cstr.charCodeAt(i);
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

  return bs + lastChar;
}

export function toByteString2(vbarray) {
  // Creating a byte map on the fly would be cpu expensive, but storing it would
  // waste memory (around 1MB which is a bit too much for old browsers).

  var byteMapping = {};
  for (var i = 0; i < 256; i++) {
    for (var j = 0; j < 256; j++) {
      byteMapping[String.fromCharCode(i + j * 256)] =
        String.fromCharCode(i) + String.fromCharCode(j);
    }
  }
  // call into VBScript utility fns
  var rawBytes = ufetch_VBArrayToString(vbarray);
  var lastChr = ufetch_VBArrayToStringLastChar(vbarray);
  return rawBytes.replace(/[\s\S]/g,
    function (match) { return byteMapping[match]; }) + lastChr;

  // return (
  //   ufetchVBArrayToString(vbarray).replace(EVERY_CHAR, splitU16) +
  //   ufetchVBArrayToStringLastChar(vbarray)
  // );
}

export function toByteString3(byteArray) {
  var scrambledStr = ufetch_VBArrayToString(byteArray);
  var lastChr = ufetch_VBArrayToStringLastChar(byteArray),
    result = "",
    i = 0,
    l = scrambledStr.length % 8,
    thischar;
  while (i < l) {
    thischar = scrambledStr.charCodeAt(i++);
    result += fromCharCode(thischar & 0xff, thischar >> 8);
  }
  l = scrambledStr.length;
  while (i < l) {
    result += fromCharCode(
      (thischar = scrambledStr.charCodeAt(i++), thischar & 0xff), thischar >> 8,
      (thischar = scrambledStr.charCodeAt(i++), thischar & 0xff), thischar >> 8,
      (thischar = scrambledStr.charCodeAt(i++), thischar & 0xff), thischar >> 8,
      (thischar = scrambledStr.charCodeAt(i++), thischar & 0xff), thischar >> 8,
      (thischar = scrambledStr.charCodeAt(i++), thischar & 0xff), thischar >> 8,
      (thischar = scrambledStr.charCodeAt(i++), thischar & 0xff), thischar >> 8,
      (thischar = scrambledStr.charCodeAt(i++), thischar & 0xff), thischar >> 8,
      (thischar = scrambledStr.charCodeAt(i++), thischar & 0xff), thischar >> 8);
  }
  result += lastChr;
  return result;
}
