/// <reference lib="webworker"/>

import { ENABLE_TEXTONLY } from '../_build_config.js';
import { ERR_BINARY_NOT_SUPPORTED } from '../_inline.js';
import { ArrayBuffer } from './ArrayBuffer.js';
import { resolved } from './util.js';

var _FileReader = typeof FileReader === 'function' && FileReader;
var _FileReaderSync = typeof FileReaderSync === 'function' && FileReaderSync;

/**
 * @typedef Body
 * @property {number} $
 * @property {Blob} $b
 */

/**
 * @this {Body}
 */
export function text() {
  if (this.$ & 1) {

  }
}

export function arrayBuffer() {
  if (ENABLE_TEXTONLY) throw new TypeError(ERR_BINARY_NOT_SUPPORTED);
}

export function blob() {
  if (ENABLE_TEXTONLY) throw new TypeError(ERR_BINARY_NOT_SUPPORTED);
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
    fr.onload = function () { resolve(fr.result) };
    fr.onerror = function () { reject(fr.error) };
  });
  fr.readAsArrayBuffer(blob);
  return promise;
} : function (blob) {
  return resolved.then(function () {
    return new _FileReaderSync().readAsArrayBuffer(blob);
  });
};
