import { ENABLE_NON_STANDARD } from '../../_build_config.js';
import { ERR_NO_NEW1, ERR_NO_NEW2, URL_FLAGS_CANNOT_BE_A_BASE, URL_HOSTNAME_STATE, URL_HOST_STATE, URL_PORT_STATE, URL_SCHEME_START_STATE } from '../../_inline.js';
import { String } from '../intrinsics.js';
import { parseURL } from './parse.js';
import { serialize, serializeHost } from './serialize.js';

/**
 *
 * @param url {string}
 * @param [base] {URL | string}
 */
function URL(url, base) {
  if (!(this instanceof URL)) {
    throw new TypeError(ERR_NO_NEW1 + 'URL' + ERR_NO_NEW2);
  }
  this._scheme = '';
  this._username = '';
  this._password = '';
  this._host = null;
  this._port = null;
  this._path = [];
  this._query = '';
  this._fragment = '';
  this._flags = 0;
  var parsedBase = null;
  if (base !== undefined) {
    if (base instanceof URL) {
      parsedBase = base;
    } else {
      parsedBase = new URL(/** @type {string} */ (base));
    }
  }
  parseURL(this, String(url), parsedBase, 0);
}

/** @this {URL} */
function hrefGet() {
  return serialize(this, false);
}

/**
 * @this {URL}
 * @param href {string}
 */
function hrefSet(href) {
  this._scheme = '';
  this._username = '';
  this._password = '';
  this._host = null;
  this._port = null;
  this._path = [];
  this._query = '';
  this._fragment = '';
  this._flags = 0;
  parseURL(this, String(href), null, 0);
}

/** @this {URL} */
function originGet() {
  switch (this._scheme) {
    case 'ftp':
    case 'http':
    case 'https':
    case 'ws':
    case 'wss':
      var output = this._scheme + '://' + serializeHost(this._host);
      if (this._port !== null) {
        output += ':' + this._port.toString(10);
      }
      return output;
    default:
      return 'null';
  }
}

/** @this {URL} */
function protocolGet() {
  return this._scheme + ':';
}

/**
 * @this {URL}
 * @param protocol {string}
 */
function protocolSet(protocol) {
  parseURL(this, String(protocol) + ':', null, URL_SCHEME_START_STATE);
}

/** @this {URL} */
function usernameGet() {
  return this._username;
}

/**
 * @this {URL}
 * @param username {string}
 */
function usernameSet(username) {
  if (this._host === null ||
      this._flags & URL_FLAGS_CANNOT_BE_A_BASE ||
      this._scheme === 'file') {
    return;
  }
  this._username = username;
}

/** @this {URL} */
function passwordGet() {
  return this._password;
}

/**
 * @this {URL}
 * @param password {string}
 */
function passwordSet(password) {
  if (this._host === null ||
      this._flags & URL_FLAGS_CANNOT_BE_A_BASE ||
      this._scheme === 'file') {
    return;
  }
  this._password = password;
}

/** @this {URL} */
function hostGet() {
  var host = serializeHost(this._host);
  if (this._port !== null) {
    host += ':' + this._port.toString(10);
  }
  return host;
}

/**
 * @this {URL}
 * @param host {string}
 */
function hostSet(host) {
  if (this._flags & URL_FLAGS_CANNOT_BE_A_BASE) {
    return;
  }
  parseURL(this, String(host), null, URL_HOST_STATE);
}

/** @this {URL} */
function hostnameGet() {
  return serializeHost(this._host);
}

/**
 * @this {URL}
 * @param host {string}
 */
function hostnameSet(host) {
  if (this._flags & URL_FLAGS_CANNOT_BE_A_BASE) {
    return;
  }
  parseURL(this, String(host), null, URL_HOSTNAME_STATE);
}

/** @this {URL} */
function portGet() {
  if (this._port === null) return '';
  return this._port.toString(10);
}

/**
 * @this {URL}
 * @param port {string}
 */
function portSet(port) {
  if (this._host === null ||
      this._flags & URL_FLAGS_CANNOT_BE_A_BASE ||
      this._scheme === 'file') {
    return;
  }
  var _port = String(port);
  if (_port === '') {
    this._port = null;
  } else {
    parseURL(this, _port, null, URL_PORT_STATE);
  }
}

/**
 * @type {import('./parse').URLRecord}
 */
// URL.prototype;

// eslint-disable-next-line es/no-object-defineproperties
if (Object.create && Object.defineProperties) {
  // eslint-disable-next-line es/no-object-defineproperties
  Object.defineProperties(URL.prototype, {
    href: {
      get: hrefGet,
      set: hrefSet
    },
    origin: {
      get: originGet
    },
    protocol: {
      get: protocolGet,
      set: protocolSet
    },
    username: {
      get: usernameGet,
      set: usernameSet
    },
    password: {
      get: passwordGet,
      set: passwordSet
    },
    host: {
      get: hostGet,
      set: hostSet
    },
    hostname: {
      get: hostnameGet,
      set: hostnameSet
    },
    port: {
      get: portGet,
      set: portSet
    }
  });
}
if (ENABLE_NON_STANDARD) {
  /**
   * @type {(
   *   <T, S>(getter: (this: S) => T, setter: (this: S, v: T) => void) =>
   *     { (this: S): T; (this: S, v: T): void; }
   * )} */
  var createGetterSetter = function createGetterSetter(getter, setter) {
    /** @this {*} */
    return function () {
      if (arguments.length !== 0) {
        setter.call(this, arguments[0]);
      } else {
        return getter.call(this);
      }
    };
  };
  URL.prototype.$$href = createGetterSetter(hrefGet, hrefSet);
  URL.prototype.$$origin = originGet;
  URL.prototype.$$protocol = createGetterSetter(protocolGet, protocolSet);
  URL.prototype.$$username = createGetterSetter(usernameGet, usernameSet);
  URL.prototype.$$password = createGetterSetter(passwordGet, passwordSet);
  URL.prototype.$$host = createGetterSetter(hostGet, hostSet);
  URL.prototype.$$hostname = createGetterSetter(hostnameGet, hostSet);
  URL.prototype.$$port = createGetterSetter(portGet, portSet);
}

URL.prototype.toJSON = hrefGet;

export { URL };
