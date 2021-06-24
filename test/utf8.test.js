// https://www.cl.cam.ac.uk/~mgk25/ucs/examples/UTF-8-test.txt
/// <reference types="chai"/>

import { decodeByteString } from '../src/internal/utf8.js';
import { UNICODE_REPLACEMENT } from '../src/_inline.js';

/**
 * @param {string} a
 * @param {string} b
 */
function stringEquals(a, b) {
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (a.charCodeAt(i) !== b.charCodeAt(i))
      return false;
  }
  return true;
}

var CORRECT_UTF8_BYTES =
  [206, 186, 225, 189, 185, 207, 131, 206, 188, 206, 181];
var CORRECT_UTF8_CHAR_CODES = [954, 8057, 963, 956, 949];

var fromCharCode = String.fromCharCode;

/** @type {string} */
var CORRECT_UTF8_BYTESTR = fromCharCode.apply(undefined, CORRECT_UTF8_BYTES);
/** @type {string} */
var CORRECT_UTF8_STR = fromCharCode.apply(undefined, CORRECT_UTF8_CHAR_CODES);

describe('UTF-8', function () {
  describe('decodeByteString()', function () {
    it('1.1 Some correct UTF-8 text', function () {
      // @ts-ignore
      assert(
        stringEquals(decodeByteString(CORRECT_UTF8_BYTESTR), CORRECT_UTF8_STR)
      );
    });
    it('1.2 Some correct UTF-8 text with a BOM', function () {
      // @ts-ignore
      assert(stringEquals(
        decodeByteString('\xef\xbb\xbf' + CORRECT_UTF8_BYTESTR),
        CORRECT_UTF8_STR
      ));
    });
    it('1.3 Empty', function () {
      // @ts-ignore
      assert(stringEquals(decodeByteString(''), ''));
    });
    it('1.4 Empty with a BOM', function () {
      // @ts-ignore
      assert(stringEquals(decodeByteString('\xef\xbb\xbf'), ''));
    });
    describe('2 Boundary condition test cases', function () {
      describe('2.1 First possible sequence of a certain length', function () {
        it('2.1.1  1 byte  (U-00000000)', function () {
          // @ts-ignore
          expect(stringEquals(decodeByteString('\x00'), '\x00'));
        });
        it('2.1.2  2 byte  (U-00000080)', function () {
          // @ts-ignore
          expect(stringEquals(decodeByteString('\x00\x80'), fromCharCode(UNICODE_REPLACEMENT)));
        });
      });
    });
  });
});
