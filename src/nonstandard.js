import { $$byteString } from './internal/Body.js';

/** @param {import('./internal/Body.js').Body} body */
export function bodyAsBinaryString(body) {
  // @ts-ignore
  return $$byteString.call(body);
}
