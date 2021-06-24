/**
 * A String which represents binary data instead of characters. Each char code
 * in the string maps to 1 byte. Since JavaScript strings are UTF-16 encoded
 * binary data will take up 2x the space it would take natively. Because of
 * this, the use case for `ByteString` is limited, never create binary strings
 * unless really needed. Only used for HTTP headers or, in old browsers, to
 * handle binary responses.
 * To retrieve a byte by index use `ByteString.charCodeAt(index) & 0xff` to
 * handle possible overflows in user-input ByteStrings.
 *
 * **TypeScript doesn't support ByteString or other similar types (USVString,
 * etc.) this is just an alias used for clarity as there is no way to enforce it
 * at a type level.**
 */
type ByteString = string & {};
/**
 * An unsigned 8-bit integer, use `u8 & 0xff` to enforce overflows.
 *
 * **TypeScript doesn't support numeric types such as u8, i32, etc. this is just
 * an alias for `number` used for clarity as there is no way to enforce these
 * number types at a type level static analysis.**
 */
type u8 = number & {};
/**
 * An Object which only exists in Internet Explorer, since it can't be
 * interacted with in any way by JavaScript (JScript) it's an empty object.
 * All property accesses, method calling, etc. results in an exception.
 * Must be passed to VBScript to be converted into a JavaScript value.
 */
type VBArray<T> = {};
/**
 * **Internet Explorer only**
 * Executes the specified script in the provided language.
 * There are no standards that apply here.
 * @param code - specifies the code to be executed.
 * @param lang - specifies the language in which the code is executed. The
 * language defaults to JScript.
 */
declare function execScript(code: string, lang?: 'VBScript' | 'VBS' | 'JScript'): void;

declare var ActiveXObject: {
  new (name: string): any;
  (name: string): any;
};
