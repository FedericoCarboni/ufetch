'use strict';

const buf = require('crypto').randomBytes(1024 * 1024);

/** @returns {(req: import('http').ClientRequest, res: import('http').ServerResponse) => void} */
const middleware = function () {
  return function (req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/testapi/echo') {
      res.writeHead(200);
      res.end(buf);
      return;
    } else if (url.pathname === '/testapi/post') {
      var bufs = [];
      req.on('data', function (d) { bufs.push(d); });
      req.on('end', function () {
        var buf1 = Buffer.concat(bufs);
        res.writeHead(200);
        if (buf1.equals(buf)) {
          res.end('true');
        } else {
          res.end('false');
        }
      });
    };
  }
};

module.exports = middleware;
