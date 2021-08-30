import { arraySlice, has, String, SymbolIterator } from './internal/intrinsics.js';
import { internal, isArray } from './internal/util.js';
import { ERR_NO_NEW1, ERR_NO_NEW2 } from './_inline.js';

var INVALID_REGEX = /[^a-zA-Z0-9\-#$%&'*+.^_`|~!]/;
var INVALID_VAL_REGEX = /[\0\n\r]/;
var LEADING_WHSP = /^[\n\r\t ]+/;
var TRAILING_WHSP = /[\n\r\t ]+$/;
// eslint-disable-next-line no-control-regex
var CORS_SAFE_REGEX = /[^\x00-\x08\x0a-\x13"():<>?@[\\\]{}\x7f]/;
var CORS_SAFE_LANG_REGEX = /[0-9A-Za-z *,-.;=]/;

/**
 * @param headers {string[]}
 * @param kind {number}
 * @class
 */
function Iterator(headers, kind) {
  this._headers = headers;
  this._kind = kind;
  this._index = 0;
}

Iterator.prototype.next = function () {
  var iterator = this;
  if (iterator._headers === undefined)
    return { value: undefined, done: true };
  do {
    var name = iterator._headers[iterator._index++];
    var value = iterator._headers[iterator._index++];
  } while (name === undefined);
  if (iterator._index >= iterator._headers.length)
    iterator._headers = undefined;
  switch (iterator._kind) {
    case 0:
      return { value: [name, value], done: false };
    case 1:
      return { value: name, done: false };
    case 2:
      return { value: value, done: false };
  }
};

if (SymbolIterator) {
  Iterator.prototype[SymbolIterator] = function () {
    return this;
  };
}

/**
 * @param {string} name
 * @returns {ByteString}
 */
function toHeaderName(name) {
  var n = String(name);
  if (INVALID_REGEX.test(n) || n === '')
    throw new TypeError("Invalid header name '" + n + "'");
  return n.toLowerCase();
}

/**
 * @param value {string}
 * @returns {ByteString}
 */
function toHeaderValue(value) {
  var v = String(value)
    .replace(LEADING_WHSP, '')
    .replace(TRAILING_WHSP, '');
  if (INVALID_VAL_REGEX.test(v))
    throw new TypeError("Invalid header value '" + String(value) + "'");
  return v;
}

/**
 * @param name {ByteString}
 */
function isForbiddenHeaderName(name) {
  return name.startsWith('proxy-') || name.startsWith('sec-') ||
    name === 'accept-charset' ||
    name === 'accept-encoding' ||
    name === 'access-control-request-headers' ||
    name === 'access-control-request-method' ||
    name === 'connection' ||
    name === 'content-length' ||
    name === 'cookie' ||
    name === 'cookie2' ||
    name === 'date' ||
    name === 'dnt' ||
    name === 'expect' ||
    name === 'host' ||
    name === 'keep-alive' ||
    name === 'origin' ||
    name === 'referer' ||
    name === 'te' ||
    name === 'trailer' ||
    name === 'transfer-encoding' ||
    name === 'upgrade' ||
    name === 'via';
}

/**
 * @param {ByteString} name
 */
function isResponseForbiddenHeaderName(name) {
  return name === 'set-cookie' || name === 'set-cookie2';
}

/**
 * @param name {ByteString}
 * @param value {ByteString}
 * @returns {boolean}
 */
function isNoCORSSafelistedRequestHeader(name, value) {
  if (value.length > 128) return false;
  switch (name) {
    case 'accept':
      return CORS_SAFE_REGEX.test(value);
    case 'accept-language':
    case 'content-language':
      return CORS_SAFE_LANG_REGEX.test(value);
    case 'content-type':
      if (!CORS_SAFE_REGEX.test(value))
        return false;
      // TODO
      return true;
  }
}

/**
 * @param headers {Headers}
 * @param name {string}
 * @param value {string}
 */
function append(headers, name, value) {
  var n = toHeaderName(name);
  var v = toHeaderValue(value);
  if (headers._guard === 'immutable')
    throw new TypeError('Cannot change immutable headers list');
  if (headers._guard === 'request' && isForbiddenHeaderName(n))
    return;
  if (headers._guard === 'response' && isResponseForbiddenHeaderName(n))
    return;
  var length = headers._headers.length;
  for (var i = 0; i < length; i += 2) {
    if (n === headers._headers[i]) {
      var tmpVal = headers._headers[i + 1] + ', ' + v;
      if (headers._guard !== 'request-no-cors' ||
          isNoCORSSafelistedRequestHeader(n, tmpVal)) {
        headers._headers[i + 1] = tmpVal;
      }
      return;
    }
  }
  headers._headers[length] = n;
  headers._headers[length + 1] = v;
}

/**
 * @param [init] {HeadersInit}
 * @class
 */
export function Headers(init) {
  var headers = this;
  if (!(headers instanceof Headers))
    throw new TypeError(ERR_NO_NEW1 + 'Headers' + ERR_NO_NEW2);
  // A plain object isn't suitable for header list because it is unordered in
  // old specs of JavaScript. Resort to an array.
  /** @type {ByteString[]} */
  headers._headers = [];
  /**
   * @type {'none' | 'immutable' | 'request' | 'request-no-cors' | 'response'}
   */
  headers._guard = internal._headersGuard;
  if (init !== null && init !== undefined) {
    if (init instanceof Headers) {
      headers._headers = arraySlice.call(init._headers, 0);
    } else if (isArray(init)) {
      var length = init.length;
      for (var i = 0; i < length; i++) {
        var header = init[i];
        append(headers, header[0], header[1]);
      }
    } else {
      for (var headerName in init) if (has.call(init, headerName)) {
        append(headers, headerName, init[headerName]);
      }
    }
  }
}

/**
 * @param {string} name
 * @param {string} value
 */
Headers.prototype.append = function (name, value) {
  append(this, name, value);
};

/**
 * @param {string} name
 * @param {string} value
 */
Headers.prototype.set = function (name, value) {
  var headers = this;
  var n = toHeaderName(name);
  var v = toHeaderValue(value);
  if (headers._guard === 'immutable')
    throw new TypeError('Cannot change immutable headers list');
  if (headers._guard === 'request' && isForbiddenHeaderName(n))
    return;
  if (headers._guard === 'response' && isResponseForbiddenHeaderName(n))
    return;
  var length = headers._headers.length;
  for (var i = 0; i < length; i += 2) {
    if (n === headers._headers[i]) {
      if (headers._guard !== 'request-no-cors' ||
          isNoCORSSafelistedRequestHeader(n, v)) {
        headers._headers[i + 1] = v;
      }
      return;
    }
  }
  headers._headers[length] = n;
  headers._headers[length + 1] = v;
};

/**
 *
 * @param {string} name
 */
Headers.prototype.get = function (name) {
  var headers = this;
  var n = toHeaderName(name);
  var length = headers._headers.length;
  for (var i = 0; i < length; i += 2) {
    if (n === headers._headers[i]) {
      return headers._headers[i + 1];
    }
  }
  return null;
};

/**
 *
 * @param name {string}
 */
Headers.prototype.has = function (name) {
  return this.get(name) !== null;
};

/**
 * @param name {string}
 */
Headers.prototype['delete'] = function (name) {
  var headers = this;
  var n = toHeaderName(name);
  var length = headers._headers.length;
  for (var i = 0; i < length; i += 2) {
    if (n === headers._headers[i]) {
      headers._headers[i] = undefined;
      headers._headers[i + 1] = undefined;
      return;
    }
  }
};

/**
 *
 * @param callback {(value: string, name: string, headers: Headers) => void}
 * @param thisArg {any}
 */
Headers.prototype.forEach = function (callback, thisArg) {
  var headers = this;
  for (var i = 0; i < headers._headers.length; ) {
    var name = headers._headers[i++];
    var value = headers._headers[i++];
    if (name !== undefined) {
      callback.call(thisArg, value, name, headers);
    } else {
      // This header has been deleted
    }
  }
};

Headers.prototype.entries = function () {
  return new Iterator(this._headers, 0);
};

Headers.prototype.keys = function () {
  return new Iterator(this._headers, 1);
};

Headers.prototype.values = function () {
  return new Iterator(this._headers, 2);
};

if (SymbolIterator)
  Headers.prototype[SymbolIterator] = function () {
    return new Iterator(this._headers, 0);
  };
