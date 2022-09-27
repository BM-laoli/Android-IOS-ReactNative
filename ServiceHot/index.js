const express = require('express');
const path = require('path');
const compressing = require('compressing');
const app = express();

app.use(express.static( path.join(__dirname, 'public')  ) );

app.listen(8085)

// 先压缩
// compressing.zip.compressFile( __dirname + '/bundleFile/bu1.android.bundle', __dirname + '/bundleFile/bu1.zip' )

// 在发送
// console.log( path.join(__dirname, 'public')   );