import { ENABLE_ACTIVE_X } from '../_build_config.js';
import { Array, objectToString } from './intrinsics.js';

var _location = typeof location !== 'undefined' && location;

export function getBaseURL() {
  return _location ? location.href : undefined;
}

/** @type {*} */
export var INTERNAL = {};

/** @type {typeof Array.isArray} */ // @ts-ignore
export var isArray = Array.isArray || function (o) {
  return objectToString.call(o) === '[object Array]';
};

export var internal = {
  _bodyKind: -1,
  /**
   * @type {'none' | 'immutable' | 'request' | 'request-no-cors' | 'response'}
   */ // @ts-ignore -- Pedantic TypeScript
  _headersGuard: 'none',
  _responseURL: ''
};

export var resolved = /**@__PURE__*/ Promise.resolve();

export var isActiveX = ENABLE_ACTIVE_X &&
  typeof ActiveXObject !== 'undefined' &&
  typeof execScript !== 'undefined';

var _ActiveXObject = isActiveX && ActiveXObject;

export {
  _ActiveXObject as ActiveXObject,
  _location as location,
};
