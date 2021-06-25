import { toByteString, toByteString3 } from '../src/internal/vbarray.js';
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
          for (var i = 0; i < 3; i++) {
            toByteString3(b);
            toByteString(b);
          }
          var start = +new Date();
          for (i = 0; i < 8; i++)
            toByteString3(b);
          console.log('ByteString3: ', (+new Date() - start) / 8000);
          start = +new Date();
          for (i = 0; i < 8; i++)
            toByteString(b);
          console.log('ByteString: ', (+new Date() - start) / 8000);
          // var start = +new Date();
          // toByteString2(b);
          // console.log('ByteString2: ', (+new Date() - start) / 1000);
          var x = new XMLHttpRequest();
          x.open('POST', '/testapi/post', false);
          x.setRequestHeader('Content-Type', 'text/plain;charset=x-user-defined');
          x.send(toByteString(b));
          console.log(x.responseText);
          // console.log(toByteString(b) === toByteString2(b));
          // var start = +new Date();
          // for (var i = 0; i < 5; i++) {
          //   toArrayBuffer(b);
          // }
          // console.log('ArrayBuffer: ', (+new Date() - start) / 1000);
          // var buf =  toArrayBuffer(b);
          done();
        }
      };
      xhr.send();
    });
  });
  // var args = Array(MAX_CALL_STACK_SIZE);
  // for (var i = 0; i < MAX_CALL_STACK_SIZE; i++)
  //   args[i] = 65;
  // var funct = 'f(a[0]';
  // for (i = 1; i < MAX_CALL_STACK_SIZE; i++) { funct += ',a[' + i + ']'; }
  // funct += ')';
  // it('maxCallStackSizeEval', function () {
  //   var f = String.fromCharCode;
  //   var a = args;
  //   f;
  //   a;
  //   var start = +new Date();
  //   console.log('maxCallStackSizeEval', (+new Date() - start) / 16000);
  // });
  // it('apply', function () {
  //   var start = +new Date();
  //   for (var i = 0; i < 16; i++) {
  //     String.fromCharCode.apply(undefined, args);
  //   }
  //   console.log('apply', (+new Date() - start) / 16000);
  // });
});
