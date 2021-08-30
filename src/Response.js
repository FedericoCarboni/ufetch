import { ENABLE_NON_STANDARD, ENABLE_TEXTONLY } from './_build_config.js';
import { $$binaryString, arrayBuffer, blob, json, text } from './internal/Body.js';
import { ERR_INVALID_STATUS, ERR_NO_NEW1, ERR_NO_NEW2 } from './_inline.js';
import { Headers } from './Headers.js';
import { internal } from './internal/util.js';
import { String } from './internal/intrinsics.js';

/**
 * @param [body] {BodyInit}
 * @param [init] {ResponseInit}
 * @class
 */
function Response(body, init) {
  var response = this;
  if (!(response instanceof Response))
    throw new TypeError(ERR_NO_NEW1 + 'Response' + ERR_NO_NEW2);

  response.bodyUsed = false;
  response._kind = internal._bodyKind;
  response._body = undefined;

  var status;
  if (init !== null && init !== undefined &&
      (status = init.status) !== null && status !== undefined) {
    status = +status;
    if (status < 200 || status > 599 || status !== (status >>> 0))
      throw new RangeError(ERR_INVALID_STATUS);
  } else {
    status = 200;
  }

  var statusText = init !== null && init !== undefined && init.statusText;
  // Construct Headers with guard response.
  internal._headersGuard = 'response';
  response.headers = new Headers(init !== null && init !== undefined
    ? init.headers
    : undefined);
  internal._headersGuard = 'none';
  response.ok = 200 <= status && status <= 299;
  response.statusText = statusText ? String(statusText) : '';
  response.url = internal._responseURL;

  if (body !== null && body !== undefined) {
    if (status === 101 ||
        status === 204 ||
        status === 205 ||
        status === 304) {
      throw new TypeError('Response status is a null body status');
    }

    response._body = body;
    // var contentType = extractBody(response, body, internal._bodyKind);
    // if (contentType !== null && !response.headers.has('Content-Type')) {
    //   response.headers.append('Content-Type', contentType);
    // }
  }
}

Response.prototype.constructor = Response;

// Inherit from Body mixin
/** @type {ReadableStream | null} */
Response.prototype.body = null;
/** @type {boolean} */
Response.prototype.bodyUsed = false;

if (!ENABLE_TEXTONLY) {
  if (ENABLE_NON_STANDARD)
    /** @type {() => Promise<ByteString>} */
    Response.prototype.$$binaryString = $$binaryString;
  /** @type {() => Promise<ArrayBuffer>} */
  Response.prototype.arrayBuffer = arrayBuffer;
  /** @type {() => Promise<Blob>} */
  Response.prototype.blob = blob;
}

/** @type {() => Promise<any>} */
Response.prototype.json = json;
/** @type {() => Promise<string>} */
Response.prototype.text = text;

Response.prototype.clone = function () {

};

Response.error = function () {
  return new Response();
};

Response.redirect = function () {};

export { Response };
