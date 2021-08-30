import { decodeURIComponent, encodeURIComponent, MathPow, parseInt } from '../intrinsics.js';
import { utf8decode, utf8encode } from '../utf8.js';

/**
 * @typedef Domain
 * @property _type {1}
 * @property _domain {string}
 */

/**
 * @typedef IPv4Address
 * @property _type {2}
 * @property _ipv4 {number}
 */

/**
 * @typedef {[
 *   number, number, number, number,
 *   number, number, number, number
 * ] & { _type: 3 }} IPv6Address
 */

/**
 * @typedef OpaqueHost
 * @property _type {4}
 * @property _host {string}
 */

/**
 * @typedef {Domain | IPv4Address | IPv6Address | OpaqueHost | null} Host
 */

/**
 * @see https://url.spec.whatwg.org/#concept-ipv6-parser
 * @param input {string}
 * @returns {IPv6Address}
 */
function parseIPv6(input) {
  // 1. Let address be a new IPv6 address whose IPv6 pieces are all 0.
  var address = /** @type {IPv6Address} */ ([0, 0, 0, 0, 0, 0, 0, 0]);
  address._type = 3;
  // 2. Let pieceIndex be 0.
  var pieceIndex = 0;
  // 3. Let compress be null.
  var compress = null;
  // 4. Let pointer be a pointer for input.
  var pointer = 0;

  var inputLength = input.length;
  var c = pointer === inputLength ? undefined : input.charCodeAt(pointer);

  // 5. If c is U+003A (:), then:
  if (c === 0x003a /* : */) {
    // 1. If remaining does not start with U+003A (:), validation
    // error, return failure.
    if (input.charCodeAt(pointer + 1) !== 0x003a /* : */) {
      // validation error
      throw new TypeError();
    }
    // 2. Increase pointer by 2.
    pointer += 2;
    c = pointer === inputLength ? undefined : input.charCodeAt(pointer);
    // 3. Increase pieceIndex by 1 and then set compress to
    // pieceIndex.
    pieceIndex += 1;
    compress = pieceIndex;
  }
  // 6. While c is not the EOF code point:
  while (c !== undefined) {
    // 1. If pieceIndex is 8, validation error, return failure.
    if (pieceIndex === 8) {
      // validation error
      throw new TypeError();
    }
    // 2. If c is U+003A (:), then:
    if (c === 0x003a /* : */) {
      // 1. If compress is non-null, validation error, return
      // failure.
      if (compress !== null) {
        // validation error
        throw new TypeError();
      }
      // 2. Increase pointer and pieceIndex by 1, set compress to
      // pieceIndex, and then continue.
      pointer += 1;
      c = pointer === inputLength ? undefined : input.charCodeAt(pointer);
      pieceIndex += 1;
      compress = pieceIndex;
      continue;
    }
    // 3. Let value and length be 0.
    var value = 0;
    var length = 0;
    // 4. While length is less than 4 and c is an ASCII hex digit, set value to
    // value × 0x10 + c interpreted as hexadecimal number, and increase pointer
    // and length by 1.
    while (length < 4 && (
      0x0030 /* 0 */ <= c && c <= 0x0039 /* 9 */ ||
      0x0041 /* A */ <= c && c <= 0x0046 /* F */ ||
      0x0061 /* a */ <= c && c <= 0x0066 /* f */)) {
      // interpret c as a hex number
      var hex = 0x0030 /* 0 */ <= c && c <= 0x0039 /* 9 */ ? c - 0x0030
        : 0x0041 /* A */ <= c && c <= 0x0046 /* F */
        ? c - 0x0037 : c - 0x0057;
      value = (value << 4) + hex;
      pointer += 1;
      c = pointer === inputLength ? undefined : input.charCodeAt(pointer);
      length += 1;
    }
    // 5. If c is U+002E (.), then:
    if (c === 0x002e /* . */) {
      // 1. If length is 0, validation error, return failure.
      if (length === 0) {
        // validation error
        throw new TypeError();
      }
      // 2. Decrease pointer by length.
      pointer -= length;
      c = pointer === inputLength ? undefined : input.charCodeAt(pointer);
      // 3. If pieceIndex is greater than 6, validation error, return failure.
      if (pieceIndex > 6) {
        // validation error
        throw new TypeError();
      }
      // 4. Let numbersSeen be 0.
      var numbersSeen = 0;
      // 5. While c is not the EOF code point:
      while (c !== undefined) {
        // 1. Let ipv4Piece be null.
        var ipv4Piece = null;
        // 2. If numbersSeen is greater than 0, then:
        if (numbersSeen > 0) {
          // 1. If c is a U+002E (.) and numbersSeen is less than 4, then
          // increase pointer by 1.
          if (c === 0x002e /* . */ && numbersSeen < 4) {
            pointer += 1;
            c = pointer === inputLength ? undefined : input.charCodeAt(pointer);
          }
          // 2. Otherwise, validation error, return failure.
          else {
            // validation error
            throw new TypeError();
          }
        }
        // 3. If c is not an ASCII digit, validation error, return failure.
        if (!(0x0030 /* 0 */ <= c && c <= 0x0039 /* 9 */)) {
          // validation error
          throw new TypeError();
        }
        // 4. While c is an ASCII digit:
        while (0x0030 /* 0 */ <= c && c <= 0x0039 /* 9 */) {
          // 1. Let number be c interpreted as decimal number.
          var number = c - 0x0030;
          // 2. If ipv4Piece is null, then set ipv4Piece to number.
          //    Otherwise, if ipv4Piece is 0, validation error, return failure.
          //    Otherwise, set ipv4Piece to ipv4Piece × 10 + number.
          if (ipv4Piece === null) {
            ipv4Piece = number;
          } else if (ipv4Piece === 0) {
            // validation error
            throw new TypeError();
          } else {
            ipv4Piece = ipv4Piece * 10 + number;
          }
          // 3. If ipv4Piece is greater than 255, validation error, return
          //    failure.
          if (ipv4Piece > 255) {
            // validation error
            throw new TypeError();
          }
          // 4. Increase pointer by 1.
          pointer += 1;
          c = pointer === inputLength ? undefined : input.charCodeAt(pointer);
        }
        // 5. Set address[pieceIndex] to address[pieceIndex] × 0x100 + ipv4Piece
        address[pieceIndex] = address[pieceIndex] * 0x100 + ipv4Piece;
        // 6. Increase numbersSeen by 1.
        numbersSeen += 1;
        // 7. If numbersSeen is 2 or 4, then increase pieceIndex by 1.
        if (numbersSeen === 2 || numbersSeen === 4) {
          pieceIndex += 1;
        }
      }
      // 6. If numbersSeen is not 4, validation error, return failure.
      if (numbersSeen !== 4) {
        // validation error
        throw new TypeError();
      }
      // 7. Break.
      break;
    }
    // 6. Otherwise, if c is U+003A (:):
    else if (c === 0x003a /* : */) {
      // 1. Increase pointer by 1.
      pointer += 1;
      c = pointer === inputLength ? undefined : input.charCodeAt(pointer);
      // 2. If c is the EOF code point, validation error, return failure.
      if (c === undefined) {
        // validation error
        throw new TypeError();
      }
    }
    // 7. Otherwise, if c is not the EOF code point, validation error, return
    // failure.
    else if (c !== undefined) {
      // validation error
      throw new TypeError();
    }
    // 8. Set address[pieceIndex] to value.
    address[pieceIndex] = value;
    // 9. Increase pieceIndex by 1.
    pieceIndex += 1;
  }

  // 7. If compress is non-null, then:
  if (compress !== null) {
    // 1. Let swaps be pieceIndex − compress.
    var swaps = pieceIndex - compress;
    // 2. Set pieceIndex to 7.
    pieceIndex = 7;
    // 3. While pieceIndex is not 0 and swaps is greater than 0, swap
    // address[pieceIndex] with address[compress + swaps − 1], and then decrease
    // both pieceIndex and swaps by 1.
    while (pieceIndex !== 0 && swaps > 0) {
      var swp = address[pieceIndex];
      address[pieceIndex] = address[compress + swaps - 1];
      address[compress + swaps - 1] = swp;
      pieceIndex -= 1;
      swaps -= 1;
    }
  }
  // 8. Otherwise, if compress is null and pieceIndex is not 8, validation
  // error, return failure.
  else if (pieceIndex !== 8) {
    // validation error
    throw new TypeError();
  }

  // 9. Return address.
  return address;
}

// forbidden host code point excluding U+0025 (%)
var FORBIDDEN_HOST_CODE_POINTS_EXCLUDING_PERCENT = /[\0\t\n\r #/:<>?@[\\\]^|]/;
// forbidden host code point
var FORBIDDEN_HOST_CODE_POINTS = /[\0\t\n\r #%/:<>?@[\\\]^|]/;

/**
 * @see https://url.spec.whatwg.org/#concept-opaque-host-parser
 * @param input {string}
 * @returns {OpaqueHost}
 */
function parseOpaqueHost(input) {
  // 1. If input contains a forbidden host code point excluding U+0025 (%),
  //    validation error, return failure.
  if (FORBIDDEN_HOST_CODE_POINTS_EXCLUDING_PERCENT.test(input)) {
    // validation error
    throw new TypeError();
  }
  // 2. If input contains a code point that is not a URL code point and not
  //    U+0025 (%), validation error.
  // skipped, validation errors are not tracked

  // 3. If input contains a U+0025 (%) and the two code points following it
  //    are not ASCII hex digits, validation error.
  // skipped, validation errors are not tracked

  // 4. Return the result of running UTF-8 percent-encode on input using the
  //    C0 control percent-encode set.

  var output = '';
  {
    // Slightly adapted version of the 'percent-encode after encoding' algorithm
    // https://url.spec.whatwg.org/#string-percent-encode-after-encoding
    // UTF-8 encoding input into a ByteString
    var bs = utf8encode(input);
    var length = bs.length;
    for (var i = 0; i < length; i++) {
      var char = bs.charAt(i);
      // If byte is in the C0 control percent encode set, append it's
      // percent-encoding to output
      // https://url.spec.whatwg.org/#c0-control-percent-encode-set
      output += '\u0000' <= char && char <= '\u001f' || char > '~'
        ? encodeURIComponent(char)
        : char;
    }
  }

  return {
    _type: 4,
    _host: output
  };
}

/**
 *
 * @param input {string}
 * @returns {IPv4Address}
 */
function parseIPv4(input) {
  // var address = /** @type {IPv4Address} */ ([0, 0, 0, 0]);
  // address._type = 2;
  // 1. Let validationError be false.
  // var validationError = false;
  // 2. Let parts be the result of strictly splitting input on U+002E (.).
  var parts = input.split('.');
  // 3. If the last item in parts is the empty string, then:
  if (parts[parts.length - 1] === '') {
    // 1. Set validationError to true.
    // validationError = true;
    // 2. If parts’s size is greater than 1, then remove the last item from
    // parts.
    if (parts.length > 1) {
      parts.length = parts.length - 1;
    }
  }
  // 4. If parts’s size is greater than 4, validation error, return failure.
  if (parts.length > 4) {
    // validation error
    throw new TypeError();
  }
  var s = parts.length;
  // 5. Let numbers be an empty list.
  var numbers = Array(s);
  // 6. For each part of parts:
  for (var i = 0; i < s; i++) {
    var part = parts[i];
    // 1. Let result be the result of parsing part.
    var result = parseIPv4Number(part);
    // 2. If result is failure, validation error, return failure.
    // 3. If result[1] is true, then set validationError to true.
    // 4. Append result[0] to numbers.
    numbers[i] = result;
  }
  // 7. If validationError is true, validation error.
  // 8. If any item in numbers is greater than 255, validation error.
  // skipped, validation errors are not tracked
  // 9. If any but the last item in numbers is greater than 255, then return
  // failure.
  if (s > 1 && numbers[0] > 0xff ||
      s > 2 && numbers[1] > 0xff ||
      s > 3 && numbers[2] > 0xff) {
    throw new TypeError();
  }
  // 10. If the last item in numbers is greater than or equal to
  // 256(5 − numbers’s size), validation error, return failure.
  var max = MathPow(256, 5 - s);
  if (s === 1 && numbers[0] >= max ||
      s === 2 && numbers[1] >= max ||
      s === 3 && numbers[2] >= max ||
      s === 4 && numbers[3] >= max) {
    throw new TypeError();
  }
  console.log(numbers);
  // 11. Let ipv4 be the last item in numbers.
  var ipv4 = numbers[s - 1];
  s -= 1;
  for (var counter = 0; counter < s; counter++) {
    ipv4 += numbers[i] * MathPow(256, 3 - counter);
  }

  return {
    _type: 2,
    _ipv4: ipv4
  };
}

var DEC_DIGITS = /^[0-9]*$/;
var HEX_DIGITS = /^[A-Fa-f0-9]*$/;
var OCT_DIGITS = /^[0-7]*$/;

/**
 *
 * @param _input {string}
 */
function parseIPv4Number(_input) {
  var input = _input;
  // 1. If input is the empty string, then return failure.
  if (input === '') {
    throw new TypeError();
  }
  // 2. Let validationError be false.
  // var validationError = false;
  // 3. Let R be 10.
  var radix = 10;
  // 4. If input contains at least two code points and the first two code points
  // are either "0x" or "0X", then:
  if (input.startsWith('0x') || input.startsWith('0X')) {
    // 1. Set validationError to true.
    // validationError = true;
    // 2. Remove the first two code points from input.
    input = input.slice(2);
    // 3. Set R to 16.
    radix = 16;
  }
  // 3. Otherwise, if input contains at least two code points and the first code
  // point is U+0030 (0), then:
  else if (input.length > 2 && input.charCodeAt(0) === 0x0030 /* 0 */) {
    // validationError = true;
    input = input.slice(1);
    radix = 8;
  }
  // 6. If input is the empty string, then return 0.
  if (input === '') {
    return 0;
  }
  // 7. If input contains a code point that is not a radix-R digit, then return
  // failure.
  if (radix === 10 && !DEC_DIGITS.test(input) ||
      radix === 16 && !HEX_DIGITS.test(input) ||
      radix === 8 && !OCT_DIGITS.test(input)) {
    throw new TypeError();
  }
  // 8. Let output be the mathematical integer value that is represented by
  // input in radix-R notation, using ASCII hex digits for digits with values
  // 0 through 15.
  return parseInt(input, radix);
}

/**
 *
 * @param input {string}
 */
function endsInANumber(input) {
  // 1. Let parts be the result of strictly splitting input on U+002E (.).
  var parts = input.split('.');
  // 2. If the last item in parts is the empty string, then:
  if (parts[parts.length - 1] === '') {
    // 1. If parts’s size is 1, then return false.
    if (parts.length === 1) {
      return false;
    }
    // 2. Remove the last item from parts.
      parts.length = parts.length - 1;
  }
  // 3. Let last be the last item in parts.
  var last = parts[parts.length - 1];
  // 4. If parsing last as an IPv4 number does not return failure, then return
  // true.
  // eslint-disable-next-line no-restricted-syntax
  try {
    parseIPv4Number(last);
    return true;
  } catch (_e) {
    //
  }
  // 5. If last is non-empty and contains only ASCII digits, then return true.
  if (last !== '' && DEC_DIGITS.test(last)) {
    return true;
  }
  // 6. Return false.
  return false;
}

/**
 * @see https://url.spec.whatwg.org/#host-parsing
 * @param input {string}
 * @param isNotSpecial {boolean}
 * @returns {Host}
 */
export function parseHost(input, isNotSpecial) {
  // 1. If input starts with U+005B ([), then:
  if (input.charCodeAt(0) === 0x005b /* [ */) {
    // 1. If input does not end with U+005D (]), validation error,
    // return failure.
    if (input.charCodeAt(input.length - 1) !== 0x005d /* ] */) {
      // validation error
      throw new TypeError();
    }
    // 2. Return the result of IPv6 parsing input with its leading
    // U+005B ([) and trailing U+005D (]) removed.
    return parseIPv6(input.slice(1, input.length - 1));
  }
  // 2. If isNotSpecial is true, then return the result of opaque-host parsing
  // input.
  if (isNotSpecial) {
    return parseOpaqueHost(input);
  }
  // 3. Assert: input is not the empty string.
  // skipped

  // 4. Let domain be the result of running UTF-8 decode without BOM on the
  // percent-decoding of input.
  var domain = utf8decode(decodeURIComponent(input), /* withoutBOM = */ true);

  // 5. Let asciiDomain be the result of running domain to ASCII on domain.
  // 6. If asciiDomain is failure, validation error, return failure.
  // TODO: implement domain to ascii
  var asciiDomain = domain.toLowerCase();

  // 7. If asciiDomain contains a forbidden host code point, validation error,
  // return failure.
  if (FORBIDDEN_HOST_CODE_POINTS.test(asciiDomain)) {
    // validation error
    throw new TypeError();
  }
  // 8. If asciiDomain ends in a number, then return the result of IPv4 parsing
  // asciiDomain.
  if (endsInANumber(asciiDomain)) {
    return parseIPv4(asciiDomain);
  }

  // 9. Return asciiDomain.
  return {
    _type: 1,
    _domain: asciiDomain
  };
}
