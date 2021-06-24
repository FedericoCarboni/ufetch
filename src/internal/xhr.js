import { ENABLE_ACTIVE_X } from '../_build_config.js';
import { ERR_XHR_NOT_FOUND } from '../_inline.js';
import { ActiveXObject, isActiveX } from './util.js';

/** @type {new () => XMLHttpRequest} */ // @ts-ignore
var _XMLHttpRequest = !ENABLE_ACTIVE_X
  ? typeof XMLHttpRequest === 'function' && XMLHttpRequest
  : typeof XMLHttpRequest === 'function'
    ? XMLHttpRequest
    : function () {
      if (!isActiveX) throw new TypeError(ERR_XHR_NOT_FOUND);
      return new ActiveXObject('MSXML2.XMLHTTP.3.0');
    };

export { _XMLHttpRequest as XMLHttpRequest };
