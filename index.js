var express = require('express');
var path = require('path');
var fs = require('fs');
var app = express();
var publicPath = path.join(__dirname, 'public');

app.use(express.static(publicPath));
console.log(publicPath);

app.get('/', function (req, res) {
  var filePath = "";
  var dir = fs.readdirSync(publicPath);
  var cts = '<div>';
  dir.filter(function (file) {
    filePath = path.join(publicPath, file);
    return fs.statSync(filePath).isFile() && /.*\.html$/.test(filePath);
  }).forEach(function (file) {
    console.log(file);
    cts = cts + '<div><a href="' + file +  '">' + file + '</a></div>';
  });
  cts = cts + '</div>';

  res.send(cts);
});


var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
