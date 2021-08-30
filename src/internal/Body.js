/// <reference lib="webworker"/>

import { ENABLE_TEXTONLY } from '../_build_config.js';
import {
  BODY_ARRAY_BUFFER,
  BODY_BLOB,
  BODY_BYTESTRING,
  BODY_UTF8,
  ERR_BINARY_NOT_SUPPORTED,
  ERR_BODY_USED,
} from '../_inline.js';
import { utf8decode, utf8encode } from './utf8.js';
import { fromArray } from './ByteString.js';
import { resolved } from './util.js';

var _FileReader = typeof FileReader === 'function' && FileReader;
var _FileReaderSync = typeof FileReaderSync === 'function' && FileReaderSync;

/**
 * @typedef Body Body mixin
 * @property body     {null}
 * @property bodyUsed {boolean}
 * @property _kind    {number}
 * @property _body    {Blob | ArrayBuffer | ByteString | string}
 */

/**
 * @this {Body}
 * @returns {Promise<string>}
 */
export function text() {
  var body = this;
  if (body.bodyUsed)
    return Promise.reject(new TypeError(ERR_BODY_USED));
  body.bodyUsed = true;
  var bodyInit = body._body;
  body._body = undefined;
  switch (body._kind) {
    case BODY_BLOB:
      return readAsText(/** @type {*} */ (bodyInit));
    case BODY_ARRAY_BUFFER:
      return null; // TODO
    case BODY_BYTESTRING:
      return resolved.then(function () {
        return utf8decode(/** @type {*} */ (bodyInit));
      });
    case BODY_UTF8:
      return Promise.resolve(/** @type {*} */ (bodyInit));
    default:
  }
}

/**
 * @this {Body}
 * @returns {Promise<ArrayBuffer>}
 */
export function arrayBuffer() {
  var body = this;
  if (ENABLE_TEXTONLY) throw new TypeError(ERR_BINARY_NOT_SUPPORTED);
  if (body.bodyUsed)
    return Promise.reject(new TypeError(ERR_BODY_USED));
  body.bodyUsed = true;
  var bodyInit = body._body;
  body._body = undefined;
  switch (body._kind) {
    case BODY_BLOB:
      return readAsArrayBuffer(/** @type {*} */ (bodyInit));
    case BODY_ARRAY_BUFFER:
      return Promise.resolve(/** @type {*} */ (bodyInit));
    case BODY_BYTESTRING:
      // var bs = body._bs;
      // body._bs = undefined;
      // return resolved.then(function () {
      //   var arrayBuffer = new SlowArrayBuffer(bs.length);
      //   fillFromByteString(arrayBuffer, bs);
      //   return arrayBuffer;
      // });
    // eslint-disable-next-line no-fallthrough
    case BODY_UTF8:
      return null; // TODO
    default:
  }
}

/**
 * Non-standard Body method, disabled by default; it has a $$ prefix so that it
 * will never be implemented in a standard specification.
 * @this {Body}
 * @returns {Promise<ByteString>}
 */
export function $$binaryString() {
  var body = this;
  if (ENABLE_TEXTONLY) throw new TypeError(ERR_BINARY_NOT_SUPPORTED);
  if (body.bodyUsed)
    return Promise.reject(new TypeError(ERR_BODY_USED));
  body.bodyUsed = true;
  var bodyInit = body._body;
  body._body = undefined;
  switch (body._kind) {
    case BODY_BLOB:
      return readAsArrayBuffer(/** @type {*} */ (bodyInit))
        .then(function (arrayBuffer) {
          // eslint-disable-next-line es/no-typed-arrays
          return fromArray(new Uint8Array(arrayBuffer));
        });
    case BODY_ARRAY_BUFFER:
      return resolved.then(function () {
        // eslint-disable-next-line es/no-typed-arrays
        var bs = fromArray(new Uint8Array(/** @type {*} */ (bodyInit))); // TODO
        return bs;
      });
    case BODY_BYTESTRING:
      return Promise.resolve(/** @type {*} */ (bodyInit));
    case BODY_UTF8:
      return resolved.then(function () {
        return utf8encode(/** @type {*} */ (bodyInit));
      });
    default:
  }
}

/**
 * @this {Body}
 * @returns {Promise<Blob>}
 */
export function blob() {
  var body = this;
  if (ENABLE_TEXTONLY) throw new TypeError(ERR_BINARY_NOT_SUPPORTED);
  if (body.bodyUsed)
    return Promise.reject(new TypeError(ERR_BODY_USED));
  body.bodyUsed = true;
  var bodyInit = body._body;
  body._body = undefined;
  switch (body._kind) {
    case BODY_BLOB:
      return Promise.resolve(/** @type {*} */ (bodyInit));
    case BODY_ARRAY_BUFFER:
      return null; // todo
    case BODY_BYTESTRING:
      return null; // todo
    case BODY_UTF8:
      return null; // todo
  }
}

/** @param s {string} */
function parseJSON(s) {
  // eslint-disable-next-line es/no-json
  return JSON.parse(s);
}

/**
 * @this {Body}
 * @returns {Promise<any>}
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
