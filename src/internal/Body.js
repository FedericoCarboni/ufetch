/// <reference lib="webworker"/>

import { ENABLE_TEXTONLY } from '../_build_config.js';
import { BODY_ARRAY_BUFFER, BODY_BLOB, BODY_BYTESTRING, BODY_UTF8, ERR_BINARY_NOT_SUPPORTED, ERR_BODY_USED } from '../_inline.js';
import { fromArray } from './ByteString.js';
import { Promise } from './intrinsics.js';
import { decodeByteString, encodeByteString } from './utf8.js';
import { resolved } from './util.js';

var _FileReader = typeof FileReader === 'function' && FileReader;
var _FileReaderSync = typeof FileReaderSync === 'function' && FileReaderSync;

/**
 * @typedef Body
 * @property bodyUsed {boolean}
 * @property _kind {number}
 * @property _blob {Blob}
 * @property _arrayBuffer {ArrayBuffer}
 * @property _bs {ByteString}
 * @property _utf8 {string}
 */

/**
 *
 * @param body {Body}
 * @param bodyInit {BodyInit}
 * @param kind {number}
 */
export function extractBody(body, bodyInit, kind) {
  switch (body._kind = kind) {
    case -1:
      throw new TypeError('Not implemented'); // TODO
    case BODY_BLOB:
      body._blob = /** @type {Blob} */ (bodyInit);
      return /** @type {Blob} */ (bodyInit).type;
    case BODY_ARRAY_BUFFER:
      body._arrayBuffer = /** @type {*} */ (bodyInit);
      return null;
    case BODY_BYTESTRING:
      body._bs = /** @type {ByteString} */ (bodyInit);
      return null;
    case BODY_UTF8:
      body._utf8 = /** @type {string} */ (bodyInit);
      return 'text/plain;charset=UTF-8';
    default:
  }
}

/**
 * @this {Body}
 * @function
 */
export function text() {
  var body = this;
  if (body.bodyUsed)
    return Promise.reject(new TypeError(ERR_BODY_USED));
  body.bodyUsed = true;
  switch (body._kind) {
    case 0:
      var blob = body._blob;
      body._blob = undefined;
      return readAsText(blob);
    case 1:
      return null; // TODO
    case 2:
      var bs = body._bs;
      body._bs = undefined;
      return resolved.then(function () {
        return decodeByteString(bs);
      });
    case 3:
      var utf8 = body._utf8;
      body._utf8 = undefined;
      return Promise.resolve(utf8);
    default:
  }
}

/**
 * @this {Body}
 */
export function arrayBuffer() {
  if (ENABLE_TEXTONLY) throw new TypeError(ERR_BINARY_NOT_SUPPORTED);
  if (body.bodyUsed)
    return Promise.reject(new TypeError(ERR_BODY_USED));
  body.bodyUsed = true;
  var body = this;
  switch (body._kind) {
    case 0:
      var blob = body._blob;
      body._blob = undefined;
      return readAsArrayBuffer(blob);
    case 1:
      return null; // TODO
    case 2:
      return null; // TODO
    case 3:
      return null; // TODO
    default:
  }
}

/**
 * @this {Body}
 * @returns {Promise<ByteString>}
 */
export function $$byteString() {
  if (ENABLE_TEXTONLY) throw new TypeError(ERR_BINARY_NOT_SUPPORTED);
  var body = this;
  if (body.bodyUsed)
    return Promise.reject(new TypeError(ERR_BODY_USED));
  body.bodyUsed = true;
  switch (body._kind) {
    case 0:
      var blob = body._blob;
      body._blob = undefined;
      return readAsArrayBuffer(blob).then(function (arrayBuffer) {
        // eslint-disable-next-line es/no-typed-arrays
        return fromArray(new Uint8Array(arrayBuffer));
      });
    case 1:
      var arrayBuffer = body._arrayBuffer;
      body._arrayBuffer = undefined;
      return resolved.then(function () {
        // eslint-disable-next-line es/no-typed-arrays
        var bs = fromArray(new Uint8Array(arrayBuffer)); // TODO
        return bs;
      });
    case 2:
      var bs = body._bs;
      body._bs = undefined;
      return Promise.resolve(bs);
    case 3:
      var utf8 = body._utf8;
      body._utf8 = undefined;
      return resolved.then(function () {
        return encodeByteString(utf8);
      });
    default:
  }
}

/**
 * @this {Body}
 */
export function blob() {
  if (ENABLE_TEXTONLY) throw new TypeError(ERR_BINARY_NOT_SUPPORTED);
  var body = this;
  if (body.bodyUsed)
    return Promise.reject(new TypeError(ERR_BODY_USED));
  body.bodyUsed = true;
  switch (body._kind) {
    case 0:
      return Promise.resolve(body._blob);
    case 1:
      return null; // todo
    case 2:
      return null; // todo
    case 3:
      return null; // todo
  }
}

/** @param {string} s */
function parseJSON(s) {
  // eslint-disable-next-line es/no-json
  return JSON.parse(s);
}

/**
 * @this {Body}
 */
export function json() {
  // @ts-ignore -- TypeScript sees text as a class for some reason
  return text.call(this).then(parseJSON);
}

/**
 *
 * @type {(blob: Blob) => Promise<string>}
 */
export var readAsText = _FileReader
  ? function (blob) {
    var fr = new _FileReader();
    var promise = new Promise(function (resolve, reject) {
      fr.onload = function () { resolve(fr.result); };
      fr.onerror = function () { reject(fr.error); };
    });
    fr.readAsText(blob, 'UTF-8');
    return promise;
  }
  : function (blob) {
    return resolved.then(function () {
      return new _FileReaderSync().readAsText(blob, 'UTF-8');
    });
  };

/**
 *
 * @type {(blob: Blob) => Promise<ArrayBuffer>}
 */
export var readAsArrayBuffer = _FileReader ? function (blob) {
  var fr = new _FileReader();
  var promise = new Promise(function (resolve, reject) {
    fr.onload = function () { resolve(fr.result); };
    fr.onerror = function () { reject(fr.error); };
  });
  fr.readAsArrayBuffer(blob);
  return promise;
} : function (blob) {
  return resolved.then(function () {
    return new _FileReaderSync().readAsArrayBuffer(blob);
  });
};
