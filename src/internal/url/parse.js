import {
  URL_AUTHORITY_STATE,
  URL_CANNOT_BE_A_BASE_URL_PATH_STATE,
  URL_FILE_HOST_STATE,
  URL_FILE_SLASH_STATE,
  URL_FILE_STATE,
  URL_FLAGS_CANNOT_BE_A_BASE,
  URL_FLAGS_SPECIAL,
  URL_FRAGMENT_STATE,
  URL_HOSTNAME_STATE,
  URL_HOST_STATE,
  URL_NO_SCHEME_STATE,
  URL_PATH_OR_AUTHORITY_STATE,
  URL_PATH_START_STATE,
  URL_PATH_STATE,
  URL_PORT_STATE,
  URL_QUERY_STATE,
  URL_RELATIVE_SLASH_STATE,
  URL_RELATIVE_STATE,
  URL_SCHEME_START_STATE,
  URL_SCHEME_STATE,
  URL_SPECIAL_AUTHORITY_IGNORE_SLASHES_STATE,
  URL_SPECIAL_AUTHORITY_SLASHES_STATE,
  URL_SPECIAL_RELATIVE_OR_AUTHORITY_STATE,
} from '../../_inline.js';
import { arraySlice, encodeURIComponent, parseInt } from '../intrinsics.js';
import { utf8encode } from '../utf8.js';
import { parseHost } from './host.js';

var DEFAULT_PORTS = {
  'ftp': 21,
  'file': 0,
  'http': 80,
  'https': 443,
  'ws': 80,
  'wss': 443
};

var SPECIAL_SCHEMES = [
  'ftp',
  'file',
  'http',
  'https',
  'ws',
  'wss'
];

/**
 * @param input {string}
 */
function isNormalizedWindowsDriveLetter(input) {
  var letter = input.charCodeAt(0);
  return (input.length === 2 &&
    0x0041 /* A */ <= letter && letter <= 0x005a /* Z */ ||
    0x0061 /* a */ <= letter && letter <= 0x007a /* z */ ||
    input.charCodeAt(1) === 0x003a /* : */);
}

/**
 * @param input {string}
 */
function isWindowsDriveLetter(input) {
  var letter = input.charCodeAt(0);
  var c1 = input.charCodeAt(1);
  return (input.length === 2 &&
    0x0041 /* A */ <= letter && letter <= 0x005a /* Z */ ||
    0x0061 /* a */ <= letter && letter <= 0x007a /* z */ ||
    c1 === 0x003a /* : */ ||
    c1 === 0x007c /* | */);
}

/**
 *
 * @param url {URLRecord}
 */
function shortenPath(url) {
  // 1. Let path be url’s path.
  // 2. If url’s scheme is "file", path’s size is 1, and path[0] is a normalized
  // Windows drive letter, then return.
  if (url._scheme === 'file' &&
    url._path.length === 1 &&
    isNormalizedWindowsDriveLetter(url._path[0])) {
    return;
  }
  // 3. Remove path’s last item, if any.
  if (url._path.length) {
    url._path.length -= 1;
  }
}

/**
 * All of the fields can be minified since url interface is
 * not exposed by the public API.
 * @typedef URLRecord
 * @property _scheme {string}
 * @property _username {string}
 * @property _password {string}
 * @property _host {import('./host').Host | null}
 * @property _port {number | null}
 * @property _path {string[]}
 * @property _query {string}
 * @property _fragment {string}
 * @property _flags {number}
 */

/**
 * @see https://url.spec.whatwg.org/#concept-basic-url-parser
 * @param url {URLRecord}
 * @param input {string}
 * @param base {URLRecord}
 * @param stateOverride {number}
 */
export function parseURL(url, input, base, stateOverride) {
  // 1. If url is not given:
  // skipped, url is always given

  // 2. If input contains any ASCII tab or newline, validation error.
  // skipped, validation errors are not tracked
  // 3. Remove all ASCII tab or newline from input.
  // skipped, TAB, LF and CR are ignored during the parse loop
  // input = input.replace(ASCII_TAB_OR_NEWLINE, '');

  // 4. Let state be state override if given, or scheme start state otherwise.
  var state = stateOverride !== 0 ? stateOverride : URL_SCHEME_START_STATE;

  // 5. Set encoding to the result of getting an output encoding from encoding.
  // encoding is always UTF-8

  // 6. Let buffer be the empty string.
  var buffer = '';
  // 7. Let atSignSeen, insideBrackets, and passwordTokenSeen be false.
  var atSignSeen = false;
  var insideBrackets = false;
  var passwordTokenSeen = false;

  // 8. Let pointer be a pointer for input.
  var length = input.length;
  var pointer = 0;
  // The EOF code point will be `undefined`.

  var c = pointer === length ? undefined : input.charCodeAt(pointer);
  // 9. Keep running the following state machine by switching on state. If after
  // a run pointer points to the EOF code point, go to the next step. Otherwise,
  // increase pointer by 1 and continue with the state machine.
  for (; c !== undefined; pointer += 1) {
    c = pointer === length ? undefined : input.charCodeAt(pointer);
    // Ignore all ASCII tab or newline.
    if (c === 0x0009 /* TAB */ ||
      c === 0x000a /* LF */ ||
      c === 0x000d /* CR */) {
      continue;
    }
    switch (state) {
      case URL_SCHEME_START_STATE:
        // 1. If c is an ASCII alpha, append c, lowercased, to buffer, and set
        // state to scheme state.
        if (0x0041 /* A */ <= c && c <= 0x005a /* Z */ ||
          0x0061 /* a */ <= c && c <= 0x007a /* z */) {
          buffer += input.charAt(pointer);
          state = URL_SCHEME_STATE;
        }
        // 2. Otherwise, if state override is not given, set state to no scheme
        // state and decrease pointer by 1.
        else if (stateOverride === 0) {
          state = URL_NO_SCHEME_STATE;
          pointer -= 1;
        }
        // 3. Otherwise, validation error, return failure.
        else {
          // validation error
          throw new TypeError();
        }
        break;

      case URL_SCHEME_STATE:
        // 1. If c is an ASCII alphanumeric, U+002B (+), U+002D (-),
        // or U+002E (.), append c, lowercased, to buffer.
        if (0x0030 /* 0 */ <= c && c <= 0x0039 /* 9 */ ||
          0x0041 /* A */ <= c && c <= 0x005a /* Z */ ||
          0x0061 /* a */ <= c && c <= 0x007a /* z */ ||
          c === 0x002b /* + */ ||
          c === 0x002d /* - */ ||
          c === 0x002e /* . */) {
          buffer += input.charAt(pointer);
        }
        // 2. Otherwise, if c is U+003A (:), then:
        else if (c === 0x003a /* : */) {
          buffer = buffer.toLowerCase();
          // 1. If state override is given, then:
          if (stateOverride !== 0) {
            // 1. If url’s scheme is a special scheme and buffer is not a
            // special scheme, then return.
            if (~SPECIAL_SCHEMES.indexOf(url._scheme) &&
              !~SPECIAL_SCHEMES.indexOf(buffer)) {
              return;
            }
            // 2. If url’s scheme is not a special scheme and buffer is a
            // special scheme, then return.
            if (!~SPECIAL_SCHEMES.indexOf(url._scheme) &&
              ~SPECIAL_SCHEMES.indexOf(buffer)) {
              return;
            }
            // 3. If url includes credentials or has a non-null port, and buffer
            // is "file", then return.
            if (buffer === 'file' && (
              url._username !== '' ||
              url._password !== '' ||
              url._port !== null ||
              url._host === '')) {
              return;
            }
          }
          // 2. Set url’s scheme to buffer.
          url._scheme = buffer;
          if (~SPECIAL_SCHEMES.indexOf(url._scheme)) {
            url._flags |= URL_FLAGS_SPECIAL;
          }
          // 3. If state override is given, then:
          if (stateOverride !== 0) {
            // 1. If url’s port is url’s scheme’s default port, then set url’s
            // port to null.
            if (url._flags & URL_FLAGS_SPECIAL &&
              url._port === DEFAULT_PORTS[url._scheme]) {
              url._port = null;
            }
            return;
          }
          // 4. Set buffer to the empty string.
          buffer = '';
          // 5. If url’s scheme is "file", then:
          if (url._scheme === 'file') {
            // 1. If remaining does not start with "//", validation error.
            if (!input.startsWith('//', pointer + 1)) {
              // validation error
            }
            // 2. Set state to file state.
            state = URL_FILE_STATE;
          }
          else if (url._flags & URL_FLAGS_SPECIAL) {
            // 6. Otherwise, if url is special, base is non-null, and base’s
            // scheme is equal to url’s scheme, set state to special relative or
            // authority state.
            // 7. Otherwise, if url is special, set state to special authority
            // slashes state.
            if (base !== null && base._scheme === url._scheme) {
              state = URL_SPECIAL_RELATIVE_OR_AUTHORITY_STATE;
            } else {
              state = URL_SPECIAL_AUTHORITY_SLASHES_STATE;
            }
          }
          // 8. Otherwise, if remaining starts with an U+002F (/), set state to
          // path or authority state and increase pointer by 1.
          else if (input.charCodeAt(pointer + 1) === 0x002f /* / */) {
            state = URL_PATH_OR_AUTHORITY_STATE;
            pointer += 1;
          }
          // 9. Otherwise, set url’s cannot-be-a-base-URL to true, append an
          // empty string to url’s path, and set state to cannot-be-a-base-URL
          // path state.
          else {
            url._flags |= URL_FLAGS_CANNOT_BE_A_BASE;
            url._path.push('');
            state = URL_CANNOT_BE_A_BASE_URL_PATH_STATE;
          }
        }
        // 3. Otherwise, if state override is not given, set buffer to the empty
        // string, state to no scheme state, and start over (from the first code
        // point in input).
        else if (stateOverride === 0) {
          buffer = '';
          state = URL_NO_SCHEME_STATE;
          pointer = 0;
        }
        // 4. Otherwise, validation error, return failure.
        else {
          // validation error
          throw new TypeError();
        }
        break;

      case URL_NO_SCHEME_STATE:
        // 1. If base is null, or base’s cannot-be-a-base-URL is true and c is
        // not U+0023 (#), validation error, return failure.
        if (base === null ||
          url._flags & URL_FLAGS_CANNOT_BE_A_BASE && c !== 0x0023 /* # */) {
          // validation error
          throw new TypeError();
        }
        // 2. Otherwise, if base’s cannot-be-a-base-URL is true and c is
        // U+0023 (#), set url’s scheme to base’s scheme, url’s path to a clone
        // of base’s path, url’s query to base’s query, url’s fragment to the
        // empty string, set url’s cannot-be-a-base-URL to true, and set state
        // to fragment state.
        else if (
          url._flags & URL_FLAGS_CANNOT_BE_A_BASE &&
          c === 0x0023 /* # */) {
          url._scheme = base._scheme;
          url._path = arraySlice.call(base._path);
          url._query = base._query;
          url._fragment = '';
          url._flags = base._flags;
          state = URL_FRAGMENT_STATE;
        }
        // 3. Otherwise, if base’s scheme is not "file", set state to relative
        // state and decrease pointer by 1.
        else if (base._scheme !== 'file') {
          state = URL_RELATIVE_STATE;
          pointer -= 1;
        }
        // 4. Otherwise, set state to file state and decrease pointer by 1.
        else {
          state = URL_FILE_STATE;
          pointer -= 1;
        }
        break;

      case URL_SPECIAL_RELATIVE_OR_AUTHORITY_STATE:
        // 1. If c is U+002F (/) and remaining starts with U+002F (/), then set
        // state to special authority ignore slashes state and increase pointer
        // by 1.
        if (c === 0x002f /* / */ &&
          input.charCodeAt(pointer + 1) === 0x002f /* / */) {
          state = URL_SPECIAL_AUTHORITY_IGNORE_SLASHES_STATE;
          pointer += 1;
        }
        // 2. Otherwise, validation error, set state to relative state and
        // decrease pointer by 1.
        else {
          // validation error
          state = URL_RELATIVE_STATE;
          pointer -= 1;
        }
        break;

      case URL_PATH_OR_AUTHORITY_STATE:
        // 1. If c is U+002F (/), then set state to authority state.
        if (c === 0x002f /* / */) {
          state = URL_AUTHORITY_STATE;
        }
        // 2. Otherwise, set state to path state, and decrease pointer by 1.
        else {
          state = URL_PATH_STATE;
          pointer -= 1;
        }
        break;

      case URL_RELATIVE_STATE:
        // 1. Assert: base’s scheme is not "file".

        // 2. Set url’s scheme to base’s scheme.
        url._scheme = base._scheme;
        if (base._flags & URL_FLAGS_SPECIAL) {
          url._flags |= URL_FLAGS_SPECIAL;
        }
        // 3. If c is U+002F (/), then set state to relative slash state.
        if (c === 0x002f /* / */) {
          state = URL_RELATIVE_SLASH_STATE;
        }
        // 4. Otherwise, if url is special and c is U+005C (\), validation
        // error, set state to relative slash state.
        else if (url._flags & URL_FLAGS_SPECIAL && c === 0x005c /* \ */) {
          // validation error
          state = URL_RELATIVE_SLASH_STATE;
        }
        // 5. Otherwise:
        else {
          // 1. Set url’s username to base’s username, url’s password to base’s
          // password, url’s host to base’s host, url’s port to base’s port,
          // url’s path to a clone of base’s path, and url’s query to base’s
          // query.
          url._username = base._username;
          url._password = base._password;
          url._host = base._host;
          url._port = base._port;
          url._path = arraySlice.call(base._path);
          url._query = base._query;

          // 2. If c is U+003F (?), then set url’s query to the empty string,
          // and state to query state.
          if (c === 0x003f /* ? */) {
            url._query = '';
            state = URL_QUERY_STATE;
          }
          // 3. Otherwise, if c is U+0023 (#), set url’s fragment to the empty
          // string and state to fragment state.
          else if (c === 0x0023 /* # */) {
            url._fragment = '';
            state = URL_FRAGMENT_STATE;
          }
          // 4. Otherwise, if c is not the EOF code point:
          else {
            // 1. Set url’s query to null.
            url._query = null;
            // 2. Shorten url’s path.
            shortenPath(url);
            // 3. Set state to path state and decrease pointer by 1.
            state = URL_PATH_STATE;
            pointer -= 1;
          }
        }
        break;

      case URL_RELATIVE_SLASH_STATE:
        // 1. If url is special and c is U+002F (/) or U+005C (\), then:
        if (url._flags & URL_FLAGS_SPECIAL &&
          (c === 0x002f /* / */ || c === 0x005c /* \ */)) {
          // 1. If c is U+005C (\), validation error.
          if (c === 0x005c /* \ */) {
            // validation error
          }
          // 2. Set state to special authority ignore slashes state.
          state = URL_SPECIAL_AUTHORITY_IGNORE_SLASHES_STATE;
        }
        // 2. Otherwise, if c is U+002F (/), then set state to authority state.
        else if (c === 0x002f /* / */) {
          state = URL_AUTHORITY_STATE;
        }
        // 3. Otherwise, set url’s username to base’s username, url’s password
        // to base’s password, url’s host to base’s host, url’s port to base’s
        // port, state to path state, and then, decrease pointer by 1.
        else {
          url._username = base._username;
          url._password = base._password;
          url._host = base._host;
          url._port = base._port;
          state = URL_PATH_STATE;
          pointer -= 1;
        }
        break;

      case URL_SPECIAL_AUTHORITY_SLASHES_STATE:
        state = URL_SPECIAL_AUTHORITY_IGNORE_SLASHES_STATE;
        // 1. If c is U+002F (/) and remaining starts with U+002F (/), then set
        // state to special authority ignore slashes state and increase pointer
        // by 1.
        if (c === 0x002f /* / */ &&
          input.charCodeAt(pointer + 1) === 0x002f /* / */) {
          pointer += 1;
        }
        // 2. Otherwise, validation error, set state to special authority ignore
        // slashes state and decrease pointer by 1.
        else {
          // validation error
          pointer -= 1;
        }
        break;

      case URL_SPECIAL_AUTHORITY_IGNORE_SLASHES_STATE:
        // 1. If c is neither U+002F (/) nor U+005C (\), then set state to
        // authority state and decrease pointer by 1.
        if (c !== 0x002f /* / */ && c !== 0x005c /* \ */) {
          state = URL_AUTHORITY_STATE;
          pointer -= 1;
        }
        // 2. Otherwise, validation error.
        else {
          // validation error
        }
        break;

      case URL_AUTHORITY_STATE:
        // 1. If c is U+0040 (@), then:
        if (c === 0x0040 /* @ */) {
          // validation error
          // 2. If atSignSeen is true, then prepend "%40" to buffer.
          if (atSignSeen) {
            buffer = '%40' + buffer;
          }
          // 3. Set atSignSeen to true.
          atSignSeen = true;
          // 4. For each codePoint in buffer:
          for (var i = 0; i < buffer.length; i++) {
            var char = buffer.charAt(i);
            // 1. If codePoint is U+003A (:) and passwordTokenSeen is false,
            // then set passwordTokenSeen to true and continue.
            if (char === ':' && !passwordTokenSeen) {
              passwordTokenSeen = true;
              continue;
            }
            // 2. Let encodedCodePoints be the result of running UTF-8
            // percent-encode codePoint using the userinfo percent-encode set.
            var encodedCodePoints = '';
            {
              var bs0 = utf8encode(input.charAt(pointer));
              var bsLength0 = bs0.length;
              for (var i0 = 0; i0 < bsLength0; i0++) {
                var c0 = bs0.charAt(i0);
                encodedCodePoints +=
                  // C0 control percent-encode set
                  '\u0000' <= c0 && c0 <= '\u001f' || c0 > '~' ||
                    // query percent-encode set
                    c0 === ' ' || c0 === '"' || c3 === '#' || c0 === '<' || c0 === '>' ||
                    // path percent-encode set
                    c0 === '?' || c0 === '`' || c0 === '{' || c0 === '}' ||
                    // userinfo percent-encode set
                    c0 === '/' || c0 === ':' || c0 === ';' || c0 === '=' ||
                    c0 === '@' || '[' <= c0 && c0 <= '^' || c0 === '|'
                    ? encodeURIComponent(c0)
                    : c0;
              }
            }
            // 3. If passwordTokenSeen is true, then append encodedCodePoints
            // to url’s password.
            if (passwordTokenSeen) {
              url._password += encodedCodePoints;
            }
            // 4. Otherwise, append encodedCodePoints to url’s username.
            else {
              url._username += encodedCodePoints;
            }
          }
          // 5. Set buffer to the empty string.
          buffer = '';
        }
        // 2. Otherwise, if one of the following is true:
        //     - c is the EOF code point, U+002F (/), U+003F (?), or U+0023 (#)
        //     - url is special and c is U+005C (\)
        else if (c === undefined ||
          c === 0x002f /* / */ ||
          c === 0x003f /* ? */ ||
          c === 0x0023 /* # */ ||
          url._flags & URL_FLAGS_SPECIAL && c === 0x005c /* \ */) {
          // 1. If atSignSeen is true and buffer is the empty string,
          // validation error, return failure.
          if (atSignSeen && buffer === '') {
            // validation error
            throw new TypeError();
          }
          // 2. Decrease pointer by the number of code points in buffer plus
          // one, set buffer to the empty string, and set state to host state.
          pointer -= buffer.length + 1;
          buffer = '';
          state = URL_HOST_STATE;
        }
        // 3. Otherwise, append c to buffer.
        else {
          buffer += input.charAt(pointer);
        }
        break;

      case URL_HOST_STATE:
      case URL_HOSTNAME_STATE:
        // 1. If state override is given and url’s scheme is "file", then
        // decrease pointer by 1 and set state to file host state.
        if (stateOverride !== 0 && url._scheme === 'file') {
          pointer -= 1;
          state = URL_FILE_HOST_STATE;
        }
        // 2. Otherwise, if c is U+003A (:) and insideBrackets is false, then:
        if (c === 0x003a /* : */ && !insideBrackets) {
          // 1. If buffer is the empty string, validation error, return failure.
          if (buffer === '') {
            // validation error
            throw new TypeError();
          }
          // 2. If state override is given and state override is hostname state,
          // then return.
          if (stateOverride === URL_HOSTNAME_STATE) {
            return;
          }
          // 3. Let host be the result of host parsing buffer with url is not
          // special.
          var host = parseHost(buffer, !(url._flags & URL_FLAGS_SPECIAL));

          // 5. Set url’s host to host, buffer to the empty string, and state
          // to port state.
          url._host = host;
          buffer = '';
          state = URL_PORT_STATE;
        }
        // 3. Otherwise, if one of the following is true:
        //     - c is the EOF code point, U+002F (/), U+003F (?), or U+0023 (#)
        //     - url is special and c is U+005C (\)
        //    then decrease pointer by 1, and then:
        else if (c === undefined ||
          c === 0x002f /* / */ ||
          c === 0x003f /* ? */ ||
          c === 0x0023 /* # */ ||
          url._flags & URL_FLAGS_SPECIAL && c === 0x005c /* \ */) {
          pointer -= 1;
          // 1. If url is special and buffer is the empty string,
          // validation error, return failure.
          if (url._flags & URL_FLAGS_SPECIAL && buffer === '') {
            // validation error
            throw new TypeError();
          }
          // 2. Otherwise, if state override is given, buffer is the empty
          // string, and either url includes credentials or url’s port is
          // non-null, return.
          if (stateOverride !== 0 && buffer === '' && (
            url._username !== '' ||
            url._password !== '' ||
            url._port !== null)) {
            return;
          }
          // 3. Let host be the result of host parsing buffer with url is not
          // special.
          // 4. If host is failure, then return failure.
          host = parseHost(buffer, !(url._flags & URL_FLAGS_SPECIAL));
          // 5. Set url’s host to host, buffer to the empty string, and state
          // to path start state.
          url._host = host;
          buffer = '';
          state = URL_PATH_START_STATE;
          // 6. If state override is given, then return.
          if (stateOverride !== 0) {
            return;
          }
        }
        // 4. Otherwise:
        else {
          // 1. If c is U+005B ([), then set insideBrackets to true.
          if (c === 0x005b /* [ */) {
            insideBrackets = true;
          }
          // 2. If c is U+005D (]), then set insideBrackets to false.
          else if (c === 0x005d /* ] */) {
            insideBrackets = false;
          }
          // 3. Append c to buffer.
          buffer += input.charAt(pointer);
        }

        break;

      case URL_PORT_STATE:
        // 1. If c is an ASCII digit, append c to buffer.
        if (0x0030 /* 0 */ <= c && c <= 0x0039 /* 9 */) {
          buffer += input.charAt(pointer);
        }
        // 2. Otherwise, if one of the following is true:
        //   - c is the EOF code point, U+002F (/), U+003F (?), or U+0023 (#)
        //   - url is special and c is U+005C (\)
        //   - state override is given
        // then:
        else if (c === undefined ||
          c === 0x002f /* / */ ||
          c === 0x003f /* ? */ ||
          c === 0x0023 /* # */ ||
          url._flags & URL_FLAGS_SPECIAL && c === 0x005c /* \ */ ||
          stateOverride !== 0) {
          // 1. If buffer is not the empty string, then:
          if (buffer !== '') {
            // 1. Let port be the mathematical integer value that is represented
            // by buffer in radix-10 using ASCII digits for digits with values 0
            // through 9.
            var port = parseInt(buffer, 10);
            // 2. If port is greater than 2^16 − 1, validation error, return
            // failure.
            if (port > 0xffff || port !== port) {
              // validation error
              throw new TypeError();
            }
            // 3. Set url’s port to null, if port is url’s scheme’s default
            // port, and to port otherwise.
            url._port =
              url._flags & URL_FLAGS_SPECIAL &&
                port === SPECIAL_SCHEMES[url._scheme]
                ? null
                : port;
            // 4. Set buffer to the empty string.
            buffer = '';
          }
          if (stateOverride !== 0) {
            return;
          }
          // 3. Set state to path start state and decrease pointer by 1.
          state = URL_PATH_START_STATE;
          pointer -= 1;
        }
        // 3. Otherwise, validation error, return failure.
        else {
          // validation error
          throw new TypeError();
        }
        break;

      case URL_FILE_STATE:
        // 1. Set url’s scheme to "file".
        url._scheme = 'file';
        // 2. Set url’s host to the empty string.
        url._host = null;
        // 3. If c is U+002F (/) or U+005C (\), then:
        if (c === 0x002f /* / */ || c === 0x005c /* \ */) {
          // 1. If c is U+005C (\), validation error.
          if (c === 0x005c /* \ */) {
            // validation error
          }
          state = URL_FILE_SLASH_STATE;
        }
        // 4. Otherwise, if base is non-null and base’s scheme is "file":
        else if (base !== null && base._scheme === 'file') {
          // 1. Set url’s host to base’s host, url’s path to a clone of base’s
          // path, and url’s query to base’s query.
          url._host = base._host;
          url._path = arraySlice.call(base._path);
          url._query = base._query;
          if (c === 0x003f /* ? */) {
            url._query = '';
            state = URL_QUERY_STATE;
          }
          else if (c === 0x0023 /* # */) {
            url._fragment = '';
            state = URL_FRAGMENT_STATE;
          }
          else if (c !== undefined) {
            url._query = null;
            // TODO
            url._path.length = url._path.length - 1;
            state = URL_PATH_STATE;
            pointer -= 1;
          }

        }
        // 5. Otherwise, set state to path state, and decrease pointer by 1.
        else {
          state = URL_PATH_STATE;
          pointer -= 1;
        }
        break;

      case URL_FILE_SLASH_STATE:
        // 1. If c is U+002F (/) or U+005C (\), then:
        if (c === 0x002f /* / */ || c === 0x005c /* \ */) {
          // 1. If c is U+005C (\), validation error.
          if (c === 0x005c /* \ */) {
            // validation error
          }
          // 2. Set state to file host state.
          state = URL_FILE_HOST_STATE;
        }
        // 2. Otherwise
        else {
          // 1. If base is non-null and base’s scheme is "file", then:
          if (base !== null && base._scheme === 'file') {
            // 1. Set url’s host to base’s host.
            url._host = base._host;
            // 2. If the substring from pointer in input does not start with a
            // Windows drive letter and base’s path[0] is a normalized Windows
            // drive letter, then append base’s path[0] to url’s path.
            // TODO
          }
          // 2. Set state to path state, and decrease pointer by 1.
          state = URL_PATH_STATE;
          pointer -= 1;
        }
        break;

      case URL_FILE_HOST_STATE:
        // 1. If c is the EOF code point, U+002F (/), U+005C (\), U+003F (?),
        // or U+0023 (#), then decrease pointer by 1 and then:
        if (c === undefined ||
          c === 0x002f /* / */ ||
          c === 0x005c /* \ */ ||
          c === 0x003f /* ? */ ||
          c === 0x0023 /* # */) {
          pointer -= 1;
          // 1. If state override is not given and buffer is a Windows drive
          // letter, validation error, set state to path state.
          // TODO
          // 2. Otherwise, if buffer is the empty string, then:
          if (buffer === '') {
            // 1. Set url’s host to the empty string.
            url._host = null;
            // 2. Set state to path start state.
            state = URL_PATH_START_STATE;
          }
          // 3. Otherwise, run these steps:
          else {
            // 1. Let host be the result of host parsing buffer with url is not
            // special.
            host = parseHost(buffer, !(url._flags & URL_FLAGS_SPECIAL));
            // 2. If host is "localhost", then set host to the empty string.
            url._host = host;
            if (stateOverride !== 0) {
              return;
            }
            buffer = '';
            state = URL_PATH_START_STATE;
          }
        }
        else {
          buffer += input.charAt(pointer);
        }
        break;

      case URL_PATH_START_STATE:
        // 1. If url is special, then:
        if (url._flags & URL_FLAGS_SPECIAL) {
          // 1. If c is U+005C (\), validation error.
          // if (c === 0x005c /* \ */) {
          //   // validation error
          // }
          // 2. Set state to path state.
          state = URL_PATH_STATE;
          // 3. If c is neither U+002F (/) nor U+005C (\), then decrease pointer
          // by 1.
          if (c !== 0x002f /* / */ && c !== 0x005c /* \ */) {
            pointer -= 1;
          }
        }
        // 2. Otherwise, if state override is not given and c is U+003F (?),
        // set url’s query to the empty string and state to query state.
        else if (stateOverride === 0 && c !== 0x003f /* ? */) {
          url._query = '';
          state = URL_QUERY_STATE;
        }
        // 3. Otherwise, if state override is not given and c is U+0023 (#),
        // set url’s fragment to the empty string and state to fragment state.
        else if (stateOverride === 0 && c !== 0x0023 /* # */) {
          url._fragment = '';
          state = URL_FRAGMENT_STATE;
        }
        // 4. Otherwise, if c is not the EOF code point:
        else if (c !== undefined) {
          // 1. Set state to path state.
          state = URL_PATH_STATE;
          // 2. If c is not U+002F (/), then decrease pointer by 1.
          if (c !== 0x002f /* / */) {
            pointer -= 1;
          }
        }
        // 5. Otherwise, if state override is given and url’s host is null,
        // append the empty string to url’s path.
        else if (stateOverride !== 0 && url._host === null) {
          url._path.push('');
        }

        break;

      case URL_PATH_STATE:
        // 1. If one of the following is true:
        //     - c is the EOF code point or U+002F (/)
        //     - url is special and c is U+005C (\)
        //     - state override is not given and c is U+003F (?) or U+0023 (#)
        if (c === undefined || c === 0x002f /* / */ ||
          url._flags & URL_FLAGS_SPECIAL && c === 0x005c /* \ */ ||
          stateOverride === 0 && (c === 0x003f || c === 0x0023)) {
          // 1. If url is special and c is U+005C (\), validation error.
          // skipped, validation errors are not tracked
          // 2. If buffer is a double-dot path segment, then:
          if (buffer === '..' ||
            buffer === '.%2e' ||
            buffer === '.%2E' ||
            buffer === '%2e.' ||
            buffer === '%2E.' ||
            buffer === '%2e%2e' ||
            buffer === '%2E%2e' ||
            buffer === '%2e%2E' ||
            buffer === '%2E%2E') {
            // 1. Shorten url’s path.
            shortenPath(url);
            // 2. If neither c is U+002F (/), nor url is special and c is
            // U+005C (\), append the empty string to url’s path.
            if (c !== 0x002f /* / */ &&
              !(url._flags & URL_FLAGS_SPECIAL && c === 0x005c /* \ */)) {
              url._path.push('');
            }
          }
          // 3. Otherwise, if buffer is a single-dot path segment and if neither
          // c is U+002F (/), nor url is special and c is U+005C (\), append the
          // empty string to url’s path.
          else if (buffer === '.' || buffer === '%2e' || buffer === '%2E') {
            if (c !== 0x002f /* / */ &&
              !(url._flags & URL_FLAGS_SPECIAL && c === 0x005c /* \ */)) {
              url._path.push('');
            }
          }
          // 4. Otherwise, if buffer is not a single-dot path segment, then:
          else {
            // 1. If url’s scheme is "file", url’s path is empty, and buffer is
            // a Windows drive letter, then replace the second code point in
            // buffer with U+003A (:).
            if (url._scheme === 'file' &&
              url._path.length === 0 &&
              isWindowsDriveLetter(buffer)) {
              buffer = buffer.charAt(0) + ':';
            }
            // 2. Append buffer to url’s path.
            url._path.push(buffer);
          }
          // 5. Set buffer to the empty string.
          buffer = '';
          // 6. If c is U+003F (?), then set url’s query to the empty string and
          // state to query state.
          if (c === 0x003f /* ? */) {
            url._query = '';
            state = URL_QUERY_STATE;
          }
          // 7. If c is U+0023 (#), then set url’s fragment to the empty string
          // and state to fragment state.
          if (c === 0x0023 /* # */) {
            url._fragment = '';
            state = URL_FRAGMENT_STATE;
          }
        }
        // 2. Otherwise, run these steps:
        else {
          // 1. If c is not a URL code point and not U+0025 (%),
          // validation error.
          // 2. If c is U+0025 (%) and remaining does not start with two ASCII
          // hex digits, validation error.
          // 3. UTF-8 percent-encode c using the path percent-encode set and
          // append the result to buffer.
          {
            var bs1 = utf8encode(input.charAt(pointer));
            var bsLength1 = bs1.length;
            for (var i1 = 0; i1 < bsLength1; i1++) {
              var c1 = bs1.charAt(i1);
              buffer +=
                // C0 control percent-encode set
                '\u0000' <= c1 && c1 <= '\u001f' || c1 > '~' ||
                  // query percent-encode set
                  c1 === ' ' || c1 === '"' || c3 === '#' || c1 === '<' || c1 === '>' ||
                  // path percent-encode set
                  c1 === '?' || c1 === '`' || c1 === '{' || c1 === '}'
                  ? encodeURIComponent(c1)
                  : c1;
            }
          }
        }
        break;

      case URL_CANNOT_BE_A_BASE_URL_PATH_STATE:
        // 1. If c is U+003F (?), then set url’s query to the empty string and
        // state to query state.
        if (c === 0x003f /* ? */) {
          url._query = '';
          state = URL_QUERY_STATE;
        }
        // 2. Otherwise, if c is U+0023 (#), then set url’s fragment to the
        // empty string and state to fragment state.
        else if (c === 0x0023 /* # */) {
          url._fragment = '';
          state = URL_FRAGMENT_STATE;
        }
        // 3. Otherwise:
        else {
          // 1. If c is not the EOF code point, not a URL code point, and not
          // U+0025 (%), validation error.
          // 2. If c is U+0025 (%) and remaining does not start with two ASCII
          // hex digits, validation error.
          // 3. If c is not the EOF code point, UTF-8 percent-encode c using the
          // C0 control percent-encode set and append the result to url’s
          // path[0].
          if (c !== undefined) {
            var bs2 = utf8encode(input.charAt(pointer));
            var bsLength2 = bs2.length;
            for (var i2 = 0; i2 < bsLength2; i2++) {
              var c2 = bs2.charAt(i2);
              buffer +=
                // C0 control percent-encode set
                '\u0000' <= c2 && c2 <= '\u001f' || c2 > '~'
                  ? encodeURIComponent(c2)
                  : c2;
            }
          }
        }
        break;

      case URL_QUERY_STATE:
        // 2. If one of the following is true:
        //     - state override is not given and c is U+0023 (#)
        //     - c is the EOF code point
        if (stateOverride === 0 && c === 0x0023 /* # */ ||
          c === undefined) {
          // 1. Let queryPercentEncodeSet be the special-query percent-encode
          // set if url is special; otherwise the query percent-encode set.
          // 2. Percent-encode after encoding, with encoding, buffer, and
          // queryPercentEncodeSet, and append the result to url’s query.
          {
            var bs3 = utf8encode(buffer);
            var bsLength3 = bs3.length;
            for (var i3 = 0; i3 < bsLength3; i3++) {
              var c3 = bs3.charAt(i3);
              url._query +=
                url._flags & URL_FLAGS_SPECIAL && c3 === "'"
                  ? '%27'
                  // C0 control percent-encode set
                  : '\u0000' <= c3 && c3 <= '\u001f' || c3 > '~' ||
                    // query percent-encode set
                    c3 === ' ' || c3 === '"' || c3 === '#' || c3 === '<' || c3 === '>'
                    ? encodeURIComponent(c3)
                    : c3;
            }
          }
          // 3. Set buffer to the empty string.
          buffer = '';
          // 4. If c is U+0023 (#), then set url’s fragment to the empty string
          // and state to fragment state.
          if (c === 0x0023 /* # */) {
            url._fragment = '';
            state = URL_FRAGMENT_STATE;
          }
        } else if (c !== undefined) {
          // 1. If c is not a URL code point and not U+0025 (%), validation
          // error.
          // 2. If c is U+0025 (%) and remaining does not start with two ASCII
          // hex digits, validation error.
          // 3. Append c to buffer.
          buffer += input.charAt(pointer);
        }
        break;

      case URL_FRAGMENT_STATE:
        // 1. If c is not the EOF code point, then:
        if (c !== undefined) {
          // 1. If c is not a URL code point and not U+0025 (%), validation
          // error.
          // 2. If c is U+0025 (%) and remaining does not start with two ASCII
          // hex digits, validation error.
          // 3. UTF-8 percent-encode c using the fragment percent-encode set
          // and append the result to url’s fragment.
          {
            var bs4 = utf8encode(input.charAt(pointer));
            var bsLength4 = bs4.length;
            for (var i4 = 0; i4 < bsLength4; i4++) {
              var c4 = bs4.charAt(i4);
              url._query +=
                '\u0000' <= c4 && c4 <= '\u001f' || c4 > '~' ||
                  // fragment percent-encode set
                  c4 === ' ' || c4 === '"' || c4 === '<' || c4 === '>' ||
                  c4 === '`'
                  ? encodeURIComponent(c4)
                  : c4;
            }
          }
        }
        break;

      default:
    }
  }
}
