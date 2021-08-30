// https://www.cl.cam.ac.uk/~mgk25/ucs/examples/UTF-8-test.txt
/// <reference types="chai"/>

import { utf8decode } from '../src/internal/utf8.js';
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

var fromCharCode = String.fromCharCode;

/** @type {ByteString} */
var CORRECT_UTF8_BYTESTR = '\xce\xba\xe1\xbd\xb9\xcf\x83\xce\xbc\xce\xb5';
/** @type {string} */
var CORRECT_UTF8_STR = '\u03ba\u1f79\u03c3\u03bc\u03b5';

describe('UTF-8', function () {
  describe('decodeByteString()', function () {
    it('1.1 Some correct UTF-8 text', function () {
      // @ts-ignore
      assert(
        stringEquals(utf8decode(CORRECT_UTF8_BYTESTR), CORRECT_UTF8_STR)
      );
    });
    it('1.2 Some correct UTF-8 text with a BOM', function () {
      // @ts-ignore
      assert(stringEquals(
        utf8decode('\xef\xbb\xbf' + CORRECT_UTF8_BYTESTR),
        CORRECT_UTF8_STR
      ));
    });
    it('1.3 Empty', function () {
      // @ts-ignore
      assert(stringEquals(utf8decode(''), ''));
    });
    it('1.4 Empty with a BOM', function () {
      // @ts-ignore
      assert(stringEquals(utf8decode('\xef\xbb\xbf'), ''));
    });
    describe('2 Boundary condition test cases', function () {
      describe('2.1 First possible sequence of a certain length', function () {
        it('2.1.1  1 byte  (U-00000000)', function () {
          // @ts-ignore
          expect(stringEquals(utf8decode('\x00'), '\x00'));
        });
        it('2.1.2  2 byte  (U-00000080)', function () {
          // @ts-ignore
          expect(stringEquals(utf8decode('\x00\x80'), fromCharCode(UNICODE_REPLACEMENT)));
        });
      });
    });
  });
});
