import { $$binaryString } from './internal/Body.js';

/** @param {import('./internal/Body.js').Body} body */
export function asBinaryString(body) { // @ts-ignore
  return $$binaryString.call(body);
}
