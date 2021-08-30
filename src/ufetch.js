import {
  ENABLE_ACCEPT_CHARSET_UTF_8,
  ENABLE_ACCEPT_CHARSET_X_USER_DEFINED,
  ENABLE_ACTIVE_X,
  ENABLE_TEXTONLY,
  ENABLE_X_REQUESTED_WITH,
} from './_build_config.js';
import {
  BODY_ARRAY_BUFFER,
  BODY_BLOB,
  BODY_BYTESTRING,
  BODY_UTF8,
  ERR_FAILED_TO_FETCH,
  XHR_DONE,
} from './_inline.js';
import { parseHeaders, setRequestHeader } from './internal/headers.js';
import { toByteString } from './internal/vbarray.js';
import { XMLHttpRequest } from './internal/xhr.js';
import { internal } from './internal/util.js';
import { Response } from './Response.js';
import { Request } from './Request.js';

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
      if (xhr.readyState !== XHR_DONE) return;
      var status = xhr.status;
      if (status === 0) {
        reject(new TypeError(ERR_FAILED_TO_FETCH));
      } else {
        var headers = /*@__NOINLINE__*/
          parseHeaders(xhr.getAllResponseHeaders());
        internal._responseURL = 'responseURL' in xhr
          ? xhr.responseURL
          : headers.get('X-Request-URL');
        var responseBody = !ENABLE_ACTIVE_X || 'responseType' in xhr
          ? (internal._bodyKind = ENABLE_TEXTONLY ? BODY_UTF8 : BODY_BLOB,
            ENABLE_TEXTONLY ? xhr.responseText : xhr.response)
          : (internal._bodyKind = BODY_BYTESTRING,
            ENABLE_ACTIVE_X && 'responseBody' in xhr
              ? /*@__NOINLINE__*/ toByteString(
                /** @type {import('./internal/xhr').XMLHttpRequest} */
                (xhr).responseBody)
              : xhr.responseText);
        var response = new Response(responseBody, {
          headers: headers,
          status: status,
          statusText: xhr.statusText
        });
        internal._bodyKind = -1;
        resolve(response);
      }
      // IE has issues with GC
      if (ENABLE_ACTIVE_X) {
        cleanup(xhr);
        xhr = undefined;
      }
    };
    function onerror() {
      reject(new TypeError(ERR_FAILED_TO_FETCH));
      // IE has issues with GC
      if (ENABLE_ACTIVE_X) {
        cleanup(xhr);
        xhr = undefined;
      }
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

    if (ENABLE_TEXTONLY && ENABLE_ACCEPT_CHARSET_UTF_8)
      xhr.setRequestHeader('Accept-Charset', 'UTF-8');

    // The X-Requested-With header is an old convention that was used before
    // CORS.
    if (ENABLE_X_REQUESTED_WITH)
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

    // Add all request headers to the XMLHttpRequest instance.
    request.headers.forEach(setRequestHeader, xhr);

    switch (request._kind) {
      case -1:
        xhr.send();
        break;
      case BODY_BLOB:
      case BODY_ARRAY_BUFFER:
      case BODY_UTF8:
        xhr.send(request._body);
        break;
      case BODY_BYTESTRING:
      default:
        throw new TypeError('Cannot send binary Request body, not supported');
    }
  });
}

export { Request, Response };
export { Headers } from './Headers.js';
