/**
 * UTf-8 decoding for `ByteString`s
 */

import { UNICODE_REPLACEMENT, MAX_CALL_STACK_SIZE, MAX_UINT_32, ERR_OUT_OF_BOUNDS } from '../_inline.js';
import { fromCharCode, Array } from './intrinsics.js';

/**
 * UTF-8 decode algorithm for ByteStrings, WHATWG compliant.
 * Uses the Unicode Replacement character on decoding error.
 * @see https://encoding.spec.whatwg.org/#utf-8-decode
 * @param {ByteString} bs
 */
export function decodeByteString(bs) {
  var length = bs.length;

  // For practical limits ByteStrings cannot be more than 4GB
  if (length > MAX_UINT_32) {
    throw new TypeError('Byte length' + ERR_OUT_OF_BOUNDS + MAX_UINT_32 + ' (4GB)');
  }

  var index = 0;

  // https://encoding.spec.whatwg.org/#utf-8-decoder
  var codePoint = 0;
  var bytesNeeded = 0;
  var lower = 0x80;
  var upper = 0xbf;

  // Check for a BOM and ignore it
  if ((bs.charCodeAt(0) & 0xff) === 0xef &&
      (bs.charCodeAt(1) & 0xff) === 0xbb &&
      (bs.charCodeAt(2) & 0xff) === 0xbf) {
    // Skip the first three bytes
    index = 3;
  }

  var s = '';

  // Process char codes in batches to reduce the number of function calls,
  // max out the allocation size to `MAX_CALL_STACK_SIZE`.
  var alloc = length;
  if (alloc > MAX_CALL_STACK_SIZE)
    alloc = MAX_CALL_STACK_SIZE;

  // Allocate a new Array with the desired length.
  /** @type {number[]} */
  var charCodes = Array(alloc);
  // Store the number of char codes currently occupied in the Array,
  // Array.length wouldn't work because the Array is preallocated.
  var charCodeN = 0;

  for (; index < length; index++) {
    var byte = bs.charCodeAt(index) & 0xff;

    if (bytesNeeded === 0) {
      if (byte <= 0x7f) {
        charCodes[charCodeN++] = byte;
      } else if (0xc2 <= byte && byte <= 0xdf) {
        bytesNeeded = 1;
        codePoint = byte & 0x1f;
      } else if (0xe0 <= byte && byte <= 0xef) {
        if (byte === 0xe0) lower = 0xa0;
        if (byte === 0xed) upper = 0x9f;
        bytesNeeded = 2;
        codePoint = byte & 0xf;
      } else if (0xf0 <= byte && byte <= 0xf4) {
        if (byte === 0xf0) lower = 0x90;
        if (byte === 0xf4) upper = 0x8f;
        bytesNeeded = 3;
        codePoint = byte & 0x7;
      } else {
        // invalid byte, append a replacement char code
        charCodes[charCodeN++] = UNICODE_REPLACEMENT;
      }
      continue;
    }

    if (byte < lower || byte > upper) {
      // invalid byte, reset state and append a replacement char code
      codePoint = bytesNeeded = 0;
      lower = 0x80;
      upper = 0xbf;
      charCodes[charCodeN++] = UNICODE_REPLACEMENT;
      continue;
    }

    lower = 0x80;
    upper = 0xbf;
    codePoint = (codePoint << 6) | (byte & 0x3f);
    bytesNeeded -= 1;

    if (bytesNeeded !== 0)
      continue;

    if (codePoint >= 0xffff) {
      // Split low and high surrogate without fromCodePoint, fromCodePoint is
      // not available in the environments targeted by this module.
      codePoint -= 0x10000;
      // High surrogate
      charCodes[charCodeN++] = (codePoint >>> 10) & 0x3ff | 0xd800;
      // Low surrogate
      codePoint = 0xdc00 | codePoint & 0x3ff;
    }

    charCodes[charCodeN++] = codePoint;
    codePoint = bytesNeeded = 0;

    // Dump to result to avoid call stack size exceeded errors.
    if (charCodeN >= MAX_CALL_STACK_SIZE) {
      charCodes.length = charCodeN;
      s += fromCharCode.apply(undefined, charCodes);
      charCodeN = 0;
    }
  }

  if (bytesNeeded) {
    // bs ended before the last code point, append a replacement char
    charCodes[charCodeN++] = UNICODE_REPLACEMENT;
  }

  // If there are still char codes left to decode, dump them to result.
  if (charCodeN) {
    // Truncate the array to `nCharCodes`, `slice` would allocate a new array
    charCodes.length = charCodeN;
    s += fromCharCode.apply(undefined, charCodes);
  }

  return s;
}

/**
 * @param {string} s
 * @returns {ByteString}
 */
export function encodeByteString(s) {
  var length = s.length;

  /** @type {ByteString} */
  var bs = '';

  var alloc = length;
  if (alloc > MAX_CALL_STACK_SIZE)
    alloc = MAX_CALL_STACK_SIZE;

  // Allocate a new Array with the desired length.
  /** @type {number[]} */
  var charCodes = Array(alloc);
  // Store the number of char codes currently occupied in the Array,
  // Array.length wouldn't work because the Array is preallocated.
  var charCodeN = 0;

  // Iterate over each code point of the string
  /** @type {number} */
  var codePoint;
  for (var i = 0; i < length; i++) {
    var c = s.charCodeAt(i);
    // 2. Depending on the value of c:

    // c < 0xd800 or c > 0xdfff
    if (c < 0xd800 || c > 0xdfff) {
      // Append to U the Unicode character with code point c.
      codePoint = c;
    }
    // 0xdc00 ≤ c ≤ 0xDfff
    else if (0xdc00 <= c && c <= 0xdfff) {
      // Append to U a U+fffd REPLACEMENT CHARACTER.
      codePoint = UNICODE_REPLACEMENT;
    }
    // 0xD800 ≤ c ≤ 0xDBff
    else if (0xd800 <= c && c <= 0xdbff) {
      // 1. If i = n−1, then append to U a U+fffD REPLACEMENT
      // CHARACTER.
      if (i === length - 1) {
        codePoint = UNICODE_REPLACEMENT;
      }
      // 2. Otherwise, i < n−1:
      else {
        // 1. Let d be the code unit in S at index i+1.
        var d = s.charCodeAt(i + 1);

        // 2. If 0xDC00 ≤ d ≤ 0xDfff, then:
        if (0xdc00 <= d && d <= 0xdfff) {
          // 1. Let a be c & 0x3ff.
          var a = c & 0x3ff;

          // 2. Let b be d & 0x3ff.
          var b = d & 0x3ff;

          // 3. Append to U the Unicode character with code point
          // 2 ** 16 + a * 2 ** 10 + b.
          codePoint = 0x10000 + (a << 10) + b;

          // 4. Set i to i + 1.
          i += 1;
        }
        // 3. Otherwise, d < 0xdc00 or d > 0xdfff. Append to U a
        // U+fffd REPLACEMENT CHARACTER.
        else {
          codePoint = UNICODE_REPLACEMENT;
        }
      }
    }
    //
    if (codePoint >= 0 && codePoint <= 0x7f) {
      charCodes[charCodeN++] = codePoint;
      continue;
    }
    //
    if (codePoint >= 0x0080 && codePoint <= 0x07ff) {
      charCodes[charCodeN++] = (codePoint >> 6) + 0xc0;
      charCodes[charCodeN++] = 0x80 | (codePoint & 0x3f);
    } else if (codePoint >= 0x0800 && codePoint <= 0xffff) {
      charCodes[charCodeN++] = (codePoint >> 12) + 0xe0;
      charCodes[charCodeN++] = 0x80 | ((codePoint >> 6) & 0x3f);
      charCodes[charCodeN++] = 0x80 | (codePoint & 0x3f);
    } else if (codePoint >= 0x10000 && codePoint <= 0x10ffff) {
      charCodes[charCodeN++] = (codePoint >> 18) + 0xf0;
      charCodes[charCodeN++] = 0x80 | ((codePoint >> 12) & 0x3f);
      charCodes[charCodeN++] = 0x80 | ((codePoint >> 6) & 0x3f);
      charCodes[charCodeN++] = 0x80 | (codePoint & 0x3f);
    }

    // Dump to result to avoid call stack size exceeded errors.
    if (charCodeN >= MAX_CALL_STACK_SIZE) {
      charCodes.length = charCodeN;
      s += fromCharCode.apply(undefined, charCodes);
      charCodeN = 0;
    }
  }

  if (charCodeN) {
    charCodes.length = charCodeN;
    bs += fromCharCode.apply(undefined, charCodes);
  }

  return bs;
}
