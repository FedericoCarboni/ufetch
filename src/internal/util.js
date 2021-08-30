import { ENABLE_ACTIVE_X } from '../_build_config.js';
import { Array, objectToString } from './intrinsics.js';

export function getBaseURL() {
  return typeof location !== 'undefined' ? location.href : undefined;
}

/** @type {*} */
// export var INTERNAL = {};

/** @type {typeof Array.isArray} */ // @ts-ignore
export var isArray = Array.isArray || function (o) {
  return objectToString.call(o) === '[object Array]';
};

export var internal = {
  _bodyKind: -1,
  _headersGuard:
  /**
   * @type {'none' | 'immutable' | 'request' | 'request-no-cors' | 'response'}
   */ ('none'),
  _responseURL: ''
};

export var resolved = /**@__PURE__*/ Promise.resolve();

export var isActiveX = ENABLE_ACTIVE_X &&
  typeof ActiveXObject !== 'undefined' &&
  typeof execScript !== 'undefined';

var _ActiveXObject = isActiveX && ActiveXObject;

export { _ActiveXObject as ActiveXObject };
