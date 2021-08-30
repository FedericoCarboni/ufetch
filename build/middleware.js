'use strict';

const buf = require('crypto').randomBytes(1024);

// require('fs').writeFileSync('buf', buf);

/** @returns {(req: import('http').ClientRequest, res: import('http').ServerResponse) => void} */
const middleware = function () {
  return function (req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/rand') {
      res.writeHead(200);
      res.end(buf);
      return;
    } else if (url.pathname === '/post') {
      var bufs = [];
      req.on('data', function (d) { bufs.push(d); });
      req.on('end', function () {
        var buf1 = Buffer.concat(bufs);
        res.writeHead(200);
        // require('fs').writeFileSync('buf1', buf1);
        if (buf1.equals(buf)) {
          res.end('true');
        } else {
          res.end('false');
        }
      });
    }
  }
};

module.exports = middleware;
