import { fetch } from '../src/ufetch.js';

describe('ufetch', function () {
  this.timeout(60000);
  it('should work', function (done) {
    fetch('/rand').then(function (response) {
      console.log(response);
      return response.$$binaryString().then(function (bs) {
        // @ts-ignore
        // console.log(bs);
        done();
      });
    })['catch'](function (err) {
      done(err);
    });
  });
});
