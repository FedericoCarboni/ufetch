import { has, String } from './internal/intrinsics.js';
import { isArray } from './internal/util.js';
import { ERR_NO_NEW1, ERR_NO_NEW2 } from './_inline.js';

var INVALID_REGEX = /[^a-zA-Z0-9\-#$%&'*+.^_`|~!]/;
var INVALID_VAL_REGEX = /[\0\n\r]/;
var LEADING_WHSP = /^[\n\r\t ]+/;
var TRAILING_WHSP = /[\n\r\t ]+$/;
// eslint-disable-next-line no-control-regex
var CORS_SAFE_REGEX = /[^\x00-\x08\x0a-\x13"():<>?@[\\\]{}\x7f]/;
var CORS_SAFE_LANG_REGEX = /[0-9A-Za-z *,-.;=]/;

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
 * @param {string} value
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
 * @param {ByteString} name
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
 * @param {ByteString} name
 * @param {ByteString} value
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
 * @param {Headers} headers
 * @param {string} name
 * @param {string} value
 */
function append(headers, name, value) {
  var n = toHeaderName(name);
  var v = toHeaderValue(value);
  if (headers.$guard === 'immutable')
    throw new TypeError('Cannot change immutable headers list');
  if (headers.$guard === 'request' && isForbiddenHeaderName(n))
    return;
  if (headers.$guard === 'response' && isResponseForbiddenHeaderName(n))
    return;
  var length = headers.$headersList.length;
  for (var i = 0; i < length; i += 2) {
    if (n === headers.$headersList[i]) {
      var tmpVal = headers.$headersList[i + 1] + ', ' + v;
      if (headers.$guard !== 'request-no-cors' ||
          isNoCORSSafelistedRequestHeader(n, tmpVal)) {
        headers.$headersList[i + 1] = tmpVal;
      }
      return;
    }
  }
  headers.$headersList[length] = n;
  headers.$headersList[length + 1] = v;
}

/**
 * @param {HeadersInit} [init]
 * @class
 */
export function Headers(init) {
  if (!(this instanceof Headers))
    throw new TypeError(ERR_NO_NEW1 + 'Headers' + ERR_NO_NEW2);
  // A plain object isn't suitable for header list because it is unordered in
  // old specs of JavaScript. Resort to an array.
  /** @type {ByteString[]} */
  this.$headersList = [];
  /**
   * @type {(
   *   'none' | 'immutable' | 'request' | 'request-no-cors' | 'response'
   * )}
   */
  this.$guard = 'none';
  if (init !== null && init !== undefined) {
    if (isArray(init)) {
      var length = init.length;
      for (var i = 0; i < length; i++) {
        var header = init[i];
        append(this, header[0], header[1]);
      }
    } else {
      for (var headerName in init) if (has.call(init, headerName)) {
        append(this, headerName, init[headerName]);
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
  if (headers.$guard === 'immutable')
    throw new TypeError('Cannot change immutable headers list');
  if (headers.$guard === 'request' && isForbiddenHeaderName(n))
    return;
  if (headers.$guard === 'response' && isResponseForbiddenHeaderName(n))
    return;
  var length = headers.$headersList.length;
  for (var i = 0; i < length; i += 2) {
    if (n === headers.$headersList[i]) {
      if (headers.$guard !== 'request-no-cors' ||
          isNoCORSSafelistedRequestHeader(n, v)) {
        headers.$headersList[i + 1] = v;
      }
      return;
    }
  }
  headers.$headersList[length] = n;
  headers.$headersList[length + 1] = v;
};

/**
 * @param {string} name
 */
Headers.prototype['delete'] = function (name) {
  var headers = this;
  var n = toHeaderName(name);
  var length = headers.$headersList.length;
  for (var i = 0; i < length; i += 2) {
    if (n === headers.$headersList[i]) {
      headers.$headersList[i] = undefined;
      headers.$headersList[i + 1] = undefined;
      return;
    }
  }
};
