import { CAPITALIZE_HEADERS, ENABLE_ACCEPT_CHARSET_UTF_8, ENABLE_ACCEPT_CHARSET_X_USER_DEFINED, ENABLE_SERVER, ENABLE_X_REQUESTED_WITH, TARGET_ACTIVEX, ENABLE_TEXTONLY } from './_build_config.js';
import { ERR_FAILED_TO_FETCH, HEADERS_STATE_NAME, HEADERS_STATE_VALUE, XHR_DONE, XHR_HEADERS_RECEIVED } from './_inline.js';

var _location = typeof location !== 'undefined' && location;
var _XHR = typeof XMLHttpRequest === 'function' && XMLHttpRequest;

// if (TARGET_ACTIVEX && !_XHR) {
//   _XHR = function () {
//     return new ActiveXObject();
//   };
// }

/** @type {any} */
var INTERNAL = {};

/** @type {(response: Response) => void} */
var _resolve;
/** @type {(reason?: unknown) => void} */
var _reject;

/**
 * @param {(response: Response) => void} f
 * @param {(reason?: unknown) => void} r
 */
function fetchExecutor(f, r) {
  _resolve = f;
  _reject = r;
}

/**
 * @typedef {object} $$XHR
 * @property {(response: Response) => void} $f
 * The function which resolves the `Promise` returned by `fetch()`.
 * @property {(reason?: unknown) => void} $r
 * The function which rejects the `Promise` returned by `fetch()`.
 * @property {Headers} $h
 * @property {AbortSignal} $s
 * The `AbortSignal` associated with the request, may be null.
 * @property {() => void} $a
 * The function listening for the `abort` event on `AbortSignal`.
 * @internal
 */

/**
 * An `XMLHttpRequest` with non-standard, custom extensions used purely for
 * the pursuit of memory efficiency.
 * @typedef {XMLHttpRequest & $$XHR} XHR
 * @internal
 */

/**
 * @param {XHR} xhr
 */
function cleanup(xhr) {
  // Remove the listener on abort signal
  if (xhr.$s) xhr.$s.removeEventListener('abort', xhr.$a);
  // Null out internal state
  xhr.$f = null;
  xhr.$r = null;
  xhr.$h = null;
  xhr.$s = null;
  xhr.$a = null;
  // Remove event listeners on the xhr
  xhr.onreadystatechange = null;
  if (!TARGET_ACTIVEX || 'onerror' in xhr)
    xhr.onerror = null;
  if (!TARGET_ACTIVEX || 'ontimeout' in xhr)
    xhr.ontimeout = null;
}

/** @this {XHR} */
function onError() {
  var reject = this.$r;
  cleanup(this);
  reject(new TypeError(ERR_FAILED_TO_FETCH));
}

/** @this {XHR} */
function onReadyStateChange() {
  var xhr = this;
  switch (xhr.readyState) {
    case XHR_HEADERS_RECEIVED:
      xhr.$h = parseHeaders(xhr.getAllResponseHeaders());
      break;
    case XHR_DONE:
      if (xhr.status === 0) {
        var reject = xhr.$r;
        reject(new TypeError(ERR_FAILED_TO_FETCH));
        return;
      }
      var response = new Response(INTERNAL, {
        headers: xhr.$h,
        status: xhr.status,
        statusText: xhr.statusText
      });
      var resolve = xhr.$f;
      resolve(response);
      cleanup(xhr);
      break;
  }
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
 * @this {XHR}
 * @param {string} value
 * @param {string} name
 */
function setRequestHeader(value, name) {
  // Old versions of IE have issues with all lowercase headers
  this.setRequestHeader(CAPITALIZE_HEADERS ? toProperCase(name) : name, value);
}

/**
 *
 * @param {ByteString} bs
 */
function parseHeaders(bs) {
  var headers = new Headers();

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
        if ((bs.charCodeAt(i) & 0xff) === 58 /* : */) {
          headerName = bs.slice(start, i).toLowerCase();
          start = i;
          state = HEADERS_STATE_VALUE;
        }
        break;
      case HEADERS_STATE_VALUE:
        switch (bs.charCodeAt(i) & 0xff) {
          case 13 /* \r */:
            if ((bs.charCodeAt(i + 1) & 0xff) === 10 /* \n */) {
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

/**
 * @param {RequestInfo} input
 * @param {RequestInit} [init]
 * @returns {Promise<Response>}
 */
function fetch(input, init) {
  // Create a new Promise and get the resolving functions
  var promise = new Promise(fetchExecutor);
  var resolve = _resolve;
  var reject = _reject;
  _resolve = _reject = undefined;

  var request = new Request(input, init);

  // Create a new XHR
  var xhr = /** @type {XHR} */ (new _XHR());

  // Extend XHR with $-prefixed properties holding the internal state of the
  // request. This is needed to reduce the number of objects allocated during
  // the request. The $ prefix should guarantee that the properties will never
  // be taken by new standard API methods.
  xhr.$f = resolve;
  xhr.$r = reject;
  xhr.$h = null;
  xhr.$s = null;
  xhr.$a = null;

  // Add event listeners to handle the exchange
  xhr.onreadystatechange = /*@__NOINLINE__*/ onReadyStateChange;
  if (!TARGET_ACTIVEX || 'onerror' in xhr)
    xhr.onerror = /*@__NOINLINE__*/ onError;
  if (!TARGET_ACTIVEX || 'ontimeout' in xhr)
    xhr.ontimeout = /*@__NOINLINE__*/ onError;

  var url = request.url;
  if (url === '' && _location) {
    url = _location.href || '';
  }

  xhr.open(request.method, url, /* async= */ true);

  switch (request.credentials) {
    case 'include':
      xhr.withCredentials = true;
      break;
    case 'omit':
      xhr.withCredentials = false;
      break;
  }

  // Unfortunately we can't change this later so we must choose the best config
  // we can and handle the response data later.
  if (!TARGET_ACTIVEX || 'responseType' in xhr)
    xhr.responseType = ENABLE_TEXTONLY ? 'text' : 'blob';

  if (!TARGET_ACTIVEX || 'overrideMimeType' in xhr) {
    // The mime type must be overridden because `XMLHttpRequest` assumes
    // `Content-Type: text/xml` and tries to parse the response as XML when the
    // server doesn't specify a `Content-Type`.
    xhr.overrideMimeType(ENABLE_TEXTONLY
      // When the target is text-only, i.e. no `blob`, `arrayBuffer` methods,
      // force the text to be interpreted as UTF-8, as required by `text` and
      // `json` methods on `Response`. This is handled by the native
      // implementation of the browser so it stays very fast.
      ? 'text/plain;charset=UTF-8'
      // Prevent the browser from parsing the `Response`, needed to retrieve
      // binary data. `XMLHttpRequest.responseText` will be set to a ByteString.
      // When setting this, if `text` or `json` is called on
      // `Response` we must parse the response body manually to UTF-8, which is
      // far slower than the native implementation found in browsers.
      // See https://web.archive.org/web/20071103070418/http://mgran.blogspot.com/2006/08/downloading-binary-streams-with.html
      : 'text/plain;charset=x-user-defined'
    );
  } else if (
    TARGET_ACTIVEX && !ENABLE_TEXTONLY &&
    ENABLE_ACCEPT_CHARSET_X_USER_DEFINED
  ) {
    /** @type {XHR} */
    (xhr).setRequestHeader('Accept-Charset', 'x-user-defined');
  }

  //
  if (ENABLE_TEXTONLY && ENABLE_ACCEPT_CHARSET_UTF_8)
    xhr.setRequestHeader('Accept-Charset', 'UTF-8');

  //
  if (ENABLE_X_REQUESTED_WITH)
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

  //
  request.headers.forEach(/*@__NOINLINE__*/ setRequestHeader, xhr);

  var signal = request.signal;
  if (signal) {
    // Allocate a new function to handle abort from AbortSignal
    (xhr.$s = signal).addEventListener('abort', xhr.$a = function () {
      xhr.abort();
      cleanup(xhr);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  }

  xhr.send();

  return promise;
}

export { fetch };
