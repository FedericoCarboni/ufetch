import {
  ENABLE_ACCEPT_CHARSET_UTF_8,
  ENABLE_ACCEPT_CHARSET_X_USER_DEFINED,
  ENABLE_ACTIVE_X,
  ENABLE_TEXTONLY,
  ENABLE_X_REQUESTED_WITH,
} from './_build_config.js';
import { BODY_BLOB, BODY_BYTESTRING, BODY_UTF8, ERR_FAILED_TO_FETCH, XHR_DONE } from './_inline.js';
import { parseHeaders, setRequestHeader } from './internal/headers.js';
import { XMLHttpRequest } from './internal/xhr.js';
import { internal } from './internal/util.js';
import { Request } from './Request.js';
import { Response } from './Response.js';
import { toByteString } from './internal/vbarray.js';
import { Promise } from './internal/intrinsics.js';

/**
 * Remove circular references from xhr, prevents memory leaks in IE.
 * @param {XMLHttpRequest} xhr
 */
function cleanup(xhr) {
  xhr.onreadystatechange = null;
  if (!ENABLE_ACTIVE_X || 'onerror' in xhr)
    xhr.onerror = null;
  if (!ENABLE_ACTIVE_X || 'ontimeout' in xhr)
    xhr.ontimeout = null;
}

/**
 *
 * @param {RequestInfo} input
 * @param {RequestInit} [init]
 * @returns {Promise<Response>}
 */
export function fetch(input, init) {
  return new Promise(function (resolve, reject) {
    var request = new Request(input, init);
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      console.log(xhr);
      switch (xhr.readyState) {
        case XHR_DONE:
          var status = xhr.status;
          if (status === 0) {
            reject(new TypeError(ERR_FAILED_TO_FETCH));
          } else {
            var response = new Response(!ENABLE_ACTIVE_X || 'responseType' in xhr
              ? (internal._bodyKind = ENABLE_TEXTONLY ? BODY_UTF8 : BODY_BLOB,
                 ENABLE_TEXTONLY ? xhr.responseText : xhr.response)
              : (internal._bodyKind = BODY_BYTESTRING,
                 toByteString(/** @type {*} */ (xhr).responseBody)), {
              headers: parseHeaders(xhr.getAllResponseHeaders()),
              status: status,
              statusText: xhr.statusText
            });
            internal._bodyKind = -1;
            resolve(response);
          }
          cleanup(xhr), xhr = null;
          break;
        default: // We shouldn't get here
      }
    };
    function onerror() {
      reject(new TypeError(ERR_FAILED_TO_FETCH));
      cleanup(xhr), xhr = null;
    }
    if (!ENABLE_ACTIVE_X || 'onerror' in xhr)
      xhr.onerror = onerror;
    if (!ENABLE_ACTIVE_X || 'ontimeout' in xhr)
      xhr.ontimeout = onerror;

    // Open the XHR
    xhr.open(request.method, request.url, /* async= */ true);

    //
    switch (request.credentials) {
      case 'include':
        xhr.withCredentials = true;
        break;
      case 'omit':
        xhr.withCredentials = false;
        break;
    }

    // Unfortunately we can't change this later so we must choose the best
    // config we can and handle the response data later.
    if (!ENABLE_ACTIVE_X || 'responseType' in xhr)
      xhr.responseType = ENABLE_TEXTONLY ? 'text' : 'blob';

    if (!ENABLE_ACTIVE_X || 'overrideMimeType' in xhr) {
      // The mime type must be overridden because `XMLHttpRequest` assumes
      // `Content-Type: text/xml` and tries to parse the response as XML when
      // the server doesn't specify a `Content-Type`.
      xhr.overrideMimeType(ENABLE_TEXTONLY
        // When the target is text-only, i.e. no `blob`, `arrayBuffer` methods,
        // force the text to be interpreted as UTF-8, as required by `text` and
        // `json` methods on `Response`. This is handled by the native
        // implementation of the browser so it stays very fast.
        ? 'text/plain;charset=UTF-8'
        // Prevent the browser from parsing the `Response`, needed to retrieve
        // binary data. `XMLHttpRequest.responseText` will be set to a
        // ByteString.
        // When setting this, if `text` or `json` is called on
        // `Response` we must parse the response body manually to UTF-8, which
        // is far slower than the native implementation found in browsers.
        // See https://web.archive.org/web/20071103070418/http://mgran.blogspot.com/2006/08/downloading-binary-streams-with.html
        : 'text/plain;charset=x-user-defined'
      );
    } else if (
      ENABLE_ACTIVE_X && !ENABLE_TEXTONLY &&
      ENABLE_ACCEPT_CHARSET_X_USER_DEFINED
    ) {
      /** @type {XMLHttpRequest} */
      (xhr).setRequestHeader('Accept-Charset', 'x-user-defined');
    }

    //
    if (ENABLE_TEXTONLY && ENABLE_ACCEPT_CHARSET_UTF_8)
      xhr.setRequestHeader('Accept-Charset', 'UTF-8');

    //
    if (ENABLE_X_REQUESTED_WITH)
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

    //
    request.headers.forEach(setRequestHeader, xhr);
    xhr.send();
  });
}

export { Request };
export { Response } from './Response.js';
export { Headers } from './Headers.js';
