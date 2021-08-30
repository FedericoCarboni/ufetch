import { ENABLE_NON_STANDARD, ENABLE_NO_CACHE, ENABLE_TEXTONLY } from './_build_config.js';
import { $$binaryString, arrayBuffer, blob, json, text } from './internal/Body.js';
import { getBaseURL, internal } from './internal/util.js';
import { Headers } from './Headers.js';
import { String } from './internal/intrinsics.js';
import { ERR_NO_NEW1, ERR_NO_NEW2 } from './_inline.js';

/** @const */
var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

/**
 * @param [input] {RequestInfo}
 * @param [init] {RequestInit}
 * @class
 */
function Request(input, init) {
  var request = this;
  if (!(request instanceof Request))
    throw new TypeError(ERR_NO_NEW1 + 'Request' + ERR_NO_NEW2);

  request.bodyUsed = false;
  request._kind = internal._bodyKind;
  request._body = undefined;

  // var baseURL = getBaseURL();

  request.method = 'GET';
  request.url = '';
  request.headers = new Headers();
  request.credentials = 'omit';

  if (input instanceof Request) {
    request.method = input.method;
    request.url = input.url;
    request.headers = new Headers(input.headers);
    request.credentials = input.credentials;
  } else {
    var url = String(input);
    var parsedURL = new URL(url, getBaseURL());
    if (parsedURL.username || parsedURL.password)
      throw new TypeError();
    request.url = parsedURL.href;
  }

  if (init && 'method' in init)
    request.method = init.method;
  var method = String(request.method).toUpperCase();
  if (~methods.indexOf(request.method))
    request.method = method;
  if (init && 'headers' in init)
    request.headers = new Headers(init.headers);
  if (init && 'credentials' in init)
    request.credentials = init.credentials;

  var body = init !== null && init !== undefined ? init.body : undefined;
  if (body !== null && body !== undefined) {
    if (request.method === 'GET' || request.method === 'HEAD')
      throw new TypeError();
    // var contentType = extractBody(request, body, internal._bodyKind);
    // if (contentType !== null && !request.headers.has('Content-Type')) {
    //   request.headers.append('Content-Type', contentType);
    // }
  }
  if (ENABLE_NO_CACHE && (request.method === 'GET' || request.method === 'HEAD')) {
    if (init && init.cache === 'no-store') {
      request.url += (/[?]/.test(request.url) ? '&' : '?') +
        '__x_ufetch_no_cache=' + (+new Date());
    }
  }
}

// Inherit from Body mixin
/** @type {ReadableStream | null} */
Request.prototype.body = null;
/** @type {boolean} */
Request.prototype.bodyUsed = false;

if (!ENABLE_TEXTONLY) {
  if (ENABLE_NON_STANDARD)
    /** @type {() => Promise<ByteString>} */
    Request.prototype.$$binaryString = $$binaryString;
  /** @type {() => Promise<ArrayBuffer>} */
  Request.prototype.arrayBuffer = arrayBuffer;
  /** @type {() => Promise<Blob>} */
  Request.prototype.blob = blob;
}

/** @type {() => Promise<any>} */
Request.prototype.json = json;
/** @type {() => Promise<string>} */
Request.prototype.text = text;

export { Request };
