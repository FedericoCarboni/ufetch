// import { toByteString } from '../src/internal/vbarray.js';
// import { XHR_DONE } from '../src/_inline.js';

// describe('responseBody', function () {
//   describe('convertResponseBody', function () {
//     this.timeout(60000);
//     it('should work', function (done) {
//       var xhr = new XMLHttpRequest();
//       xhr.open('GET', '/rand', true);
//       xhr.onreadystatechange = function () {
//         if (xhr.readyState === XHR_DONE) {
//           // @ts-ignore
//           var b = xhr.responseBody;
//           var start = +new Date();
//           for (var i = 0; i < 8; i++)
//             toByteString(b);
//           console.log('ByteString: ', (+new Date() - start) / 8000);
//           // var start = +new Date();
//           // toByteString2(b);
//           // console.log('ByteString2: ', (+new Date() - start) / 1000);
//           var x = new XMLHttpRequest();
//           x.open('POST', '/testapi/post', false);
//           x.setRequestHeader('Content-Type', 'text/plain;charset=x-user\
//   defined');
//           x.send(toByteString(b));
//           console.log(x.responseText);
//           // console.log(toByteString(b) === toByteString2(b));
//           // var start = +new Date();
//           // for (var i = 0; i < 5; i++) {
//           //   toArrayBuffer(b);
//           // }
//           // console.log('ArrayBuffer: ', (+new Date() - start) / 1000);
//           // var buf =  toArrayBuffer(b);
//           done();
//         }
//       };
//       xhr.send();
//     });
//   });
// });
