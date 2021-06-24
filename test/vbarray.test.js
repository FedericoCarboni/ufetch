import { toByteString, toByteString2, toByteString3 } from '../src/internal/vbarray.js';
import { XMLHttpRequest } from '../src/internal/xhr.js';
import { XHR_DONE } from '../src/_inline.js';

describe('responseBody', function () {
  describe('convertResponseBody', function () {
    this.timeout(60000);
    it('should work', function (done) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/testapi/echo', true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === XHR_DONE) {
          // @ts-ignore
          var b = xhr.responseBody;
          var start = +new Date();
          toByteString3(b);
          console.log('ByteString3: ', (+new Date() - start) / 1000);
          // var start = +new Date();
          // toByteString2(b);
          // console.log('ByteString2: ', (+new Date() - start) / 1000);
          var start = +new Date();
          toByteString(b);
          console.log('ByteString: ', (+new Date() - start) / 1000);
          var x = new XMLHttpRequest();
          x.open('POST', '/testapi/post', false);
          x.setRequestHeader('Content-Type', 'application/octet-stream');
          x.send(toByteString(b));
          console.log(x.responseText);
          // console.log(toByteString(b) === toByteString2(b));
          // var start = +new Date();
          // for (var i = 0; i < 5; i++) {
          //   toArrayBuffer(b);
          // }
          // console.log('ArrayBuffer: ', (+new Date() - start) / 1000);
          // var buf =  toArrayBuffer(b);
          // console.log(buf, get(buf, 0), get(buf, 1), get(buf, 2), get(buf, 3), get(buf, 4));
          done();
        }
      };
      xhr.send();
    });
  });
});
