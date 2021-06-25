import { Array, arraySlice, Infinity, MathAbs, MathFloor, MathMax, MathMin } from './intrinsics.js';
import { ERR_NO_NEW1, ERR_NO_NEW2 } from '../_inline.js';
import { INTERNAL } from './util.js';

/** @param {*} arg */
function toIntOrInf(arg) {
  var n = +arg;
  if (n !== n || n === 0) return 0;
  if (n === Infinity) return n;
  if (n === -Infinity) return n;
  var int = MathFloor(MathAbs(arg));
  if (int < 0) int = -int;
  return int;
}

/**
 * @param {number} length
 * @class
 */
function ArrayBuffer(length) {
  if (length === INTERNAL) return;

  var arrayBuffer = this;
  if (!(arrayBuffer instanceof ArrayBuffer))
    throw new TypeError(ERR_NO_NEW1 + 'ArrayBuffer' + ERR_NO_NEW2);

  // ToUint32(length), for practical reasons length is limited to MAX_UINT_32.
  var byteLength = length >>> 0;
  //  size = Math.floor(byteLength / 4) + (byteLength % 4 !== 0 ? 1 : 0)
  var size = (byteLength >>> 2) + (byteLength & 3 & 1);

  // Allocate a new Array where the ArrayBuffer data will be stored.
  /** @type {number[]} */
  var plainArray = Array(size);
  // Zero fill the internal array
  for (var i = size - 1; i !== -1; i--) {
    plainArray[i] = 0;
  }

  arrayBuffer.byteLength = byteLength;

  /**
   * An Array of uint32s representing the bytes of the ArrayBuffer. This is
   * still not ideal because we're using twice the space actually needed.
   * @type {number[]}
   */
  arrayBuffer._data = plainArray;
}

// constructor property, some old browsers don't support it.
ArrayBuffer.prototype.constructor = ArrayBuffer;

/**
 * This should be a getter, but they're not available in old browsers, so
 * we'll just use an instance property.
 * Set to 0 on the prototype to preserve the shape of the prototype.
 */
ArrayBuffer.prototype.byteLength = 0;

/**
 * @param {number} [start]
 * @param {number} [end]
 */
ArrayBuffer.prototype.slice = function (start, end) {
  var arrayBuffer = this;
  var byteLength = arrayBuffer.byteLength;
  var _start = toIntOrInf(start);
  if (_start === -Infinity) {
    _start = 0;
  } else if (_start < 0) {
    _start = MathMax(0, byteLength + _start);
  } else {
    _start = MathMin(_start, byteLength);
  }
  _start >>>= 0;
  var _end = end === undefined ? byteLength : toIntOrInf(end);
  if (_end === -Infinity) {
    _end = 0;
  } else if (_end < 0) {
    _end = MathMax(0, byteLength + _end);
  } else {
    _end = MathMin(_end, byteLength);
  }
  _end >>>= 0;
  if (_start === 0 && _end === byteLength) {
    var newArrayBuffer = new ArrayBuffer(INTERNAL);
    newArrayBuffer.byteLength = byteLength;
    newArrayBuffer._data = arraySlice.call(arrayBuffer._data, 0, byteLength);
  } else {
    var newByteLength = MathMax(0, _end - _start);
    //  newSize = Math.floor(byteLength / 4) + (byteLength % 4 !== 0 ? 1 : 0)
    var newSize = (newByteLength >>> 2) + (newByteLength & 3 ? 1 : 0);
    newArrayBuffer = new ArrayBuffer(INTERNAL);
    newArrayBuffer.byteLength = newByteLength;
    if (_start & 3) {
      newArrayBuffer._data = Array(newSize);
      for (var i = newByteLength; i !== 0; i--) {
        setEmpty(newArrayBuffer, i, get(arrayBuffer, i));
      }
    } else {
      newArrayBuffer._data = arraySlice.call(
        arrayBuffer._data,
        _start >>> 2,
        (_end >>> 2) + (_end & 3 ? 1 : 0)
      );
      switch (_end & 3) {
        case 3:
          newArrayBuffer._data[_end >>> 2] &= 0xffffff00;
          break;
        case 2:
          newArrayBuffer._data[_end >>> 2] &= 0xffff0000;
          break;
        case 1:
          newArrayBuffer._data[_end >>> 2] &= 0xff000000;
      }
    }
  }
  return newArrayBuffer;
};

/**
 * NOT IMPLEMENTE YET
 * @param _x {*}
 * @returns {_ is ArrayBuffer}
 */
ArrayBuffer.isView = function (_x) {
  return true; // TODO: fixme
};

/**
 * @param arrayBuffer {ArrayBuffer}
 * @param index {number} MUST be non-negative
 * @param u8 {number} MUST be between 0-255
 */
export function setEmpty(arrayBuffer, index, u8) {
  //  idx = Math.floor(index / 4);
  var idx = index >>> 2;
  /** @type {number} */
  var u32;
  //     (index % 4)
  switch (index & 3) {
    case 0:
      u32 = (u8 << 24) >>> 0;
      break;
    case 1:
      u32 = (u8 << 16) >>> 0;
      break;
    case 2:
      u32 = (u8 << 8) >>> 0;
      break;
    case 3:
      u32 = u8 >>> 0;
      break;
  }
  arrayBuffer._data[idx] = u32;
}

/**
 * @param {ArrayBuffer} arrayBuffer
 * @param {number} index MUST be non-negative
 * @param {number} u8 MUST be between 0-255
 */
export function set(arrayBuffer, index, u8) {
  //  idx = Math.floor(index / 4);
  var idx = index >>> 2;
  var val = arrayBuffer._data[idx];
  /** @type {number} */
  var u32;
  //     (index % 4)
  switch (index & 3) {
    case 0:
      u32 = ((val & 0x00ffffff) | (u8 << 24)) >>> 0;
      break;
    case 1:
      u32 = ((val & 0xff00ffff) | (u8 << 16)) >>> 0;
      break;
    case 2:
      u32 = ((val & 0xffff00ff) | (u8 << 8)) >>> 0;
      break;
    case 3:
      u32 = ((val & 0xffffff00) | u8) >>> 0;
      break;
  }
  arrayBuffer._data[idx] = u32;
}

/**
 * @param {ArrayBuffer} arrayBuffer
 * @param {number} index MUST be non-negative
 * @returns {number}
 */
export function get(arrayBuffer, index) {
  //  idx = Math.floor(index / 4);
  var idx = index >>> 2;
  var val = arrayBuffer._data[idx];
  var u8;
  //     (index % 4)
  switch (index & 3) {
    case 0:
      u8 = (val & 0xff000000) >>> 24;
      break;
    case 1:
      u8 = (val & 0x00ff0000) >>> 16;
      break;
    case 2:
      u8 = (val & 0x0000ff00) >>> 8;
      break;
    case 3:
      u8 = (val & 0x000000ff) >>> 0;
      break;
  }
  return u8;
}

export { ArrayBuffer };
