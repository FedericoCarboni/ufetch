import { URL_FLAGS_CANNOT_BE_A_BASE } from '../../_inline.js';

/**
 *
 * @param ipv6 {import('./host').IPv6Address}
 * @returns
 */
function findLongestZeroSequence(ipv6) {
  var maxIndex = null;
  var maxLength = 1;
  var currStart = null;
  var currLength = 0;
  var index = 0;
  for (; index < 8; index++) {
    if (ipv6[index] !== 0) {
      if (currLength > maxLength) {
        maxIndex = currStart;
        maxLength = currLength;
      }
      currStart = null;
      currLength = 0;
    } else {
      if (currStart === null) currStart = index;
      ++currLength;
    }
  }
  if (currLength > maxLength) {
    maxIndex = currStart;
    maxLength = currLength;
  }
  return maxIndex;
}

/**
 *
 * @param host {import('./host').Host}
 */
export function serializeHost(host) {
  if (host === null) return '';
  var output = '';
  switch (host._type) {
    case 1:
      return host._domain;
    case 2:
      var n = host._ipv4;
      output = '.' + (n & 0xff).toString(10) + output;
      n >>= 8;
      output = '.' + (n & 0xff).toString(10) + output;
      n >>= 8;
      output = '.' + (n & 0xff).toString(10) + output;
      n >>= 8;
      output = (n & 0xff).toString(10) + output;
      return output;
    case 3:
      output += '[';
      var compress = findLongestZeroSequence(host);
      var ignore0 = false;
      for (var pieceIndex = 0; pieceIndex < 8; pieceIndex++) {
        if (ignore0 && host[0] === 0) {
          continue;
        } else if (ignore0) {
          ignore0 = false;
        }
        if (compress === pieceIndex) {
          var separator = pieceIndex === 0 ? '::' : ':';
          output += separator;
          ignore0 = true;
          continue;
        }
        output += host[pieceIndex].toString(16);
        if (pieceIndex !== 7) output += ':';
      }
      output += ']';
      return output;
    case 4:
      return host._host;
  }
}


/**
 * @param url {import('./URL').URL}
 * @param excludeFragment {boolean} false
 */
export function serialize(url, excludeFragment) {
  var output = url._scheme + ':';
  if (url._host !== null) {
    output += '//';
    if (url._username !== '' || url._password !== '') {
      output += url._username;
      if (url._password !== '') {
        output += ':' + url._password;
      }
      output += '@';
    }
    output += serializeHost(url._host);
    if (url._port !== null) {
      output += ':' + url._port.toString(10);
    }
  }
  if (url._flags & URL_FLAGS_CANNOT_BE_A_BASE) {
    output += url._path[0];
  } else {
    if (url._host === null && url._path.length > 1 && url._path[0] === '') {
      output += '/.';
    }
    output += '/' + url._path.join('/');
  }
  if (url._query !== '') {
    output += '?' + url._query;
  }
  if (!excludeFragment && url._fragment !== '') {
    output += '#' + url._fragment;
  }
  return output;
}
