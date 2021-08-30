import { fromCharCode } from '../intrinsics.js';

/**
 *
 * @param input {string}
 * @returns {number[]}
 */
function toCodePoints(input) {
  var codePoints = [];
  var length = input.length;
  var pointer = 0;
  for (; pointer < length; pointer += 1) {
    var codePoint = input.charCodeAt(pointer);
    if (codePoint >= 0xd800 && c <= 0xdbff && pointer < length) {
      var c = input.charCodeAt(pointer + 1);
      if ((c & 0xfc00) === 0xdc00) {
        codePoint = ((codePoint & 0x3ff) << 10) + (c & 0x3ff) + 0x10000;
        pointer += 1;
      }
    }
    codePoints.push(codePoint);
  }
  return codePoints;
}

/**
 *
 * @param input {string}
 */
export function encode(input) {
  var result = '';

  var codePoints = toCodePoints(input);
  var length = codePoints.length;

  /** @type {number} */
  var codePoint;
  var i = 0;
  for (; i < length; i++) {
    codePoint = codePoints[i];
    if (codePoint < 0x80) {
      result += fromCharCode(codePoint);
    }
  }

  var basicCodePoints = result.length;
  if (basicCodePoints) {
    result += '-';
  }

  // var
  // missing implementation
}
