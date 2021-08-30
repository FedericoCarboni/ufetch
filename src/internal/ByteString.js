import { ERR_OUT_OF_BOUNDS, MAX_CALL_STACK_POWER, MAX_CALL_STACK_SIZE, MAX_INT_32 } from '../_inline.js';
import { arraySlice, fromCharCode } from './intrinsics.js';

/**
 * @param bytes {Array<number> | Uint8Array}
 * @returns {ByteString}
 */
export function fromArray(bytes) {
  // This function makes a few of assumptions to optimize for speed:
  //  - bytes is a valid Array of 0-255 numbers or NATIVE Uint8Array object
  //  - bytes size is less than 2GiB
  //  - Function.apply supports ArrayLike objects or bytes is a proper Array

  var length = bytes.length;
  if (length > MAX_INT_32) {
    throw new TypeError('Byte length' + ERR_OUT_OF_BOUNDS + MAX_INT_32 + ' (2GiB)');
  }

  if (length <= MAX_CALL_STACK_SIZE) {
    // Convert bytes to a string in a single batch, if bytes is an array it's
    // fine to use apply, if it's a Uint8Array assume apply allows ArrayLike
    // objects.
    return fromCharCode.apply(undefined, /** @type {*} */ (bytes));
  }

  // Allocate a MAX_CALL_STACK_SIZE sized Array and fill it with the first
  // values from bytes. This Array will be reused throughout this function to
  // avoid costly allocations and garbage collections.
  /** @type {number[]} */
  var charCodes = arraySlice.call(bytes, 0, MAX_CALL_STACK_SIZE);
  // Get the integer part of length / MAX_CALL_STACK_SIZE
  var batches = length >> MAX_CALL_STACK_POWER;
  // Get the remainder of length / MAX_CALL_STACK_SIZE
  var charCodesLeft = length & (MAX_CALL_STACK_SIZE - 1);
  // Decode the first batch of char codes to a string.
  // In old IE it would be faster to allocate an Array and use .join() on it
  // but Firefox, Chrome and IE11 are faster with +=.
  /** @type {ByteString} */
  var bs = fromCharCode.apply(undefined, charCodes);

  // Process the bytes in batches
  for (var batch = 1; batch < batches; batch++) {
    var offset = batch << MAX_CALL_STACK_POWER;
    for (var i = 0; i < MAX_CALL_STACK_SIZE; i++) {
      //                   i + offset = i | offset
      charCodes[i] = bytes[i | offset];
    }
    bs += fromCharCode.apply(undefined, charCodes);
  }

  // If there are char codes left to decode
  if (charCodesLeft) {
    // resize charCodes to charCodesLeft
    charCodes.length = charCodesLeft;
    // loop from 0 to charCodesLeft
    for (i = 0; i < charCodesLeft; i++) {
      //                   i + offset = i | offset
      charCodes[i] = bytes[i | offset];
    }
    bs += fromCharCode.apply(undefined, charCodes);
  }

  return bs;
}
