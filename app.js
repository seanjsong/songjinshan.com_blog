var http = require('http'),
    express = require('express'),
    sync = require('synchronize'),
    mongodb = require('mongodb'),
    updatedb = require('./updatedb'),
    blogapp = require('./blogapp');

// configurations
var mongoClient = mongodb.Db('blog', new mongodb.Server("127.0.0.1", 27017, {safe: true}), {});
var articlesDir = __dirname + '/articles';
var staticDir = __dirname + '/build';

// we have to synchronize during initializtion phase, so we wrap everything within a fiber
sync.fiber(function() {
  var db = sync.await(mongoClient.open(sync.defer()));
  var blogCollection = sync.await(db.createCollection('blog', sync.defer()));
  sync.await(updatedb(blogCollection, articlesDir, sync.defer()));

  var app = express();
  app.configure(function() {
    app.set('port', process.env.PORT || 10000);
    app.use('/blog', blogapp('/blog', blogCollection, articlesDir, staticDir));
  });

  http.createServer(app).listen(app.get('port'), function() {
    console.log("Express server listening on port " + app.get('port'));
  });
});