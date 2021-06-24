import { ArrayBuffer, get, set } from '../src/internal/ArrayBuffer.js';

describe('works', function () {
  it('works', function () {
    var ab = new ArrayBuffer(90);
    console.log(ab);
    set(ab, 1, 231);
    console.log(get(ab, 1));
  });
});
