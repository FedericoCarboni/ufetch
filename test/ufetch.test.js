import { fetch } from '../src/ufetch.js';

describe('ufetch', function () {
  it('should work', function (done) {
    // @ts-ignore
    fetch('/testapi/echo').then(function (response) {
      return response.$$byteString().then(function (bs) {
        console.log(bs.length);
        done();
      });
    })['catch'](function (err) {
      done(err);
    });
  });
});
