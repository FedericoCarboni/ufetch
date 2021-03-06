var _Array = Array;
var _String = String;
var _Blob = typeof Blob === 'function' && Blob;
var _ArrayBuffer = typeof ArrayBuffer === 'function' && ArrayBuffer;
var _Object = Object;
// eslint-disable-next-line es/no-symbol -- guarded
var _Symbol = typeof Symbol === 'function' && Symbol;
var _Infinity = 1 / 0;
var _Math = Math;
var _encodeURIComponent = encodeURIComponent;
var _decodeURIComponent = decodeURIComponent;
var _parseInt = parseInt;
export var SymbolIterator = _Symbol && _Symbol.iterator;
export var objectToString = _Object.prototype.toString;
export var has = _Object.prototype.hasOwnProperty;
export var arraySlice = _Array.prototype.slice;
export var fromCharCode = _String.fromCharCode;
export var MathFloor = _Math.floor;
export var MathAbs = _Math.abs;
export var MathMax = _Math.max;
export var MathMin = _Math.min;
export var MathPow = _Math.pow;
export {
  _Array as Array,
  _String as String,
  _Blob as Blob,
  _ArrayBuffer as ArrayBuffer,
  _Object as Object,
  _Infinity as Infinity,
  _Symbol as Symbol,
  _Math as Math,
  _encodeURIComponent as encodeURIComponent,
  _decodeURIComponent as decodeURIComponent,
  _parseInt as parseInt,
};
