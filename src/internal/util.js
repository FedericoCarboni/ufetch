import { ENABLE_ACTIVE_X } from '../_build_config.js';
import { Array, objectToString } from './intrinsics.js';

/** @type {*} */
export var INTERNAL = {};

/** @type {typeof Array.isArray} */ // @ts-ignore
export var isArray = Array.isArray || function (o) {
  return objectToString.call(o) === '[object Array]';
};


export var resolved = /**@__PURE__*/ new Promise((function (resolve) { resolve(); }));

export var isActiveX = ENABLE_ACTIVE_X &&
  typeof ActiveXObject !== 'undefined' &&
  typeof execScript !== 'undefined';

var _ActiveXObject = isActiveX && ActiveXObject;
var _location = typeof location !== 'undefined' && location;
export {
  _ActiveXObject as ActiveXObject,
  _location as location,
};
