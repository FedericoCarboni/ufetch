import { Headers } from '../Headers.js';
import { ENABLE_SERVER } from '../_build_config.js';
import { HEADERS_STATE_NAME, HEADERS_STATE_VALUE } from '../_inline.js';
import { internal, isActiveX } from './util.js';

/**
 *
 * @param {ByteString} bs
 */
export function parseHeaders(bs) {
  internal._headersGuard = 'response';
  var headers = new Headers();
  internal._headersGuard = 'none';

  if (bs === '') {
    return headers;
  }

  /** @type {string} */
  var headerName;
  var state = HEADERS_STATE_NAME;

  var length = bs.length;
  var start = 0;
  var lastNonSpace = 0;

  for (var i = 0; i < length; i++) {
    switch (state) {
      case HEADERS_STATE_NAME:
        if (bs.charCodeAt(i) === 58 /* : */) {
          headerName = bs.slice(start, i).toLowerCase();
          start = i;
          state = HEADERS_STATE_VALUE;
        }
        break;
      case HEADERS_STATE_VALUE:
        switch (bs.charCodeAt(i)) {
          case 13 /* \r */:
            if (bs.charCodeAt(i + 1) === 10 /* \n */) {
              if (!ENABLE_SERVER || headerName !== 'x-ufetch')
                headers.append(headerName, bs.slice(start, i));
              start = i += 2;
              state = HEADERS_STATE_NAME;
            }
            break;
          case 32 /*   */:
          case 9 /* \t */:
            if (start > lastNonSpace) {
              start = i + 1;
            }
            break;
          default:
            lastNonSpace = i;
        }
        break;
    }
  }

  return headers;
}

/** @param {string} s */
function toUpperCase(s) {
  return s.toUpperCase();
}

var PROPERCASE_REGEX = /-[a-z]/g;

/** @param {string} name */
function toProperCase(name) {
  return name.charAt(0).toUpperCase() + name.slice(1)
    .replace(PROPERCASE_REGEX, toUpperCase);
}

/**
 * @this {XMLHttpRequest}
 * @param {string} value
 * @param {string} name
 */
export function setRequestHeader(value, name) {
  // Old versions of IE have issues with all lowercase headers
  this.setRequestHeader(isActiveX ? toProperCase(name) : name, value);
}
