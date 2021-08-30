// import { encodeByteString, decodeByteString } from './src/internal/utf8.js';
// import fs from 'fs';

// console.log(
//   decodeByteString(encodeByteString('網站有中、英文版本，也有繁、簡體版，可通過每頁左上角的連結隨時調整。')),
//   encodeByteString('網站有中、英文版本，也有繁、簡體版，可通過每頁左上角的連結隨時調整。'),
//   '網站有中、英文版本，也有繁、簡體版，可通過每頁左上角的連結隨時調整。'.length,
//   encodeByteString('網站有中、英文版本，也有繁、簡體版，可通過每頁左上角的連結隨時調整。').length,
//   decodeByteString("ç¶²ç«æä¸­ãè±æçæ¬ï¼ä¹æç¹ãç°¡é«çï¼å¯ééæ¯é å·¦ä¸è§çé£çµé¨æèª¿æ´ã")
// );

// var base = process.memoryUsage().heapUsed;
// console.log(base);
// global.arr = Array(Math.pow(2, 24) - 1).fill(0);
// console.log(process.memoryUsage().heapUsed - base);
// global.arr.length = 0;
// setImmediate(() => console.log(process.memoryUsage().heapUsed - base));

var parseURL = require("./dist/parser").parseURL;
var url = { _scheme: '', _username: '', _password: '', _host: null, _port: null, _path: [], _query: '', _fragment: '', _flags: 0 };
parseURL(url, "http://user:pass@foo:21/bar;par?b#c", null, 0)
console.log(url);
