var http = require('http'),
    express = require('express'),
    mdblog = require('mdblog');

var app = express();

app.configure(function() {
  app.set('port', process.env.PORT || 10000);
  app.use('/blog', mdblog('/blog', __dirname + '/articles', __dirname + '/static'));
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

