/// <reference path="../_types.d.ts"/>

/**
 * **IE Only (VBScript Function)**
 * Convert a VBArray into a JS String
 * @param arr The VBArray to convert to a JS String, limited to 2^31-1 (2GiB).
 * @returns A JS String where each character code represents a 2-byte couple, if
 * the length of the array is odd it will not return the last character.
 */
declare function ufetch_vbs_0(arr: VBArray<u8>): string;
/**
 * **IE Only (VBScript Function)**
 * @returns The last character in the VBArray.
 */
declare function ufetch_vbs_1(arr: VBArray<u8>): string;
/** Compile time constant */
declare const VBARRAY_SCRIPT: string;
