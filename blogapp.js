/**
 * @fileoverview This is the main entrance of mdblog module, require('mdblog') returns a function.
 * Calling this function and you'll get an express app, which is configured by the parameters
 * you passed into the function. You can listen on the returned express app alone, or you can
 * mount the app to your express root app.
 * @author songjinshan@gmail.com (Seann Soong)
 */

var express = require('express'),
    async = require('async'),
    _ = require('underscore');

/**
 * The function constructing an express app is exported
 * @param {string} urlPrefix such as '/blog', set this to '' if you wanna use this app directly as root app
 * @param {string} articlesDir the absolute path where you put blog categories, articles and article attachments
 * @param {string} staticDir the absolute path where you put html/js/css files
 * @return {express app}
 */
module.exports = function(urlPrefix, blogCollection, articlesDir, staticDir) {
  /**
   * helper function, memoized get categories
   * the type of callback is {Function(Error=, Object.<string, number>)}
   * string is category name, number is the amount of articles within this category
   */
  var getCategories = (function() {
    var _categories;
    return function(cb) {
      if (_categories) {cb(null, _categories); return;}
      blogCollection.find({}, ['category']).toArray(
        function(err, categories) {
          if (err) {cb(err); return;}
          cb(null, _.countBy(_.pluck(categories, 'category')));
        }
      );
    };
  })();

  /**
   * response with category list
   * response format is {categories: Array.<Tuple<string, number>>}
   * string is category name, number is the amount of articles within this category
   * sorted in alphabetical order of category name
   */
  function routeCategories(req, res) {
    getCategories(function(err, categories) {
      if (err) throw err;
      categories = _.pairs(categories).sort(function(a, b) {return a[0] > b[0];});
      res.set('Cache-Control', 'public, max-age=' + (3600*24));
      res.json({categories: categories});
    });
  }

  // /**
  //  * helper function, given page number and total articles, calculate start the end article number
  //  * @param {number} page
  //  * @param {number} total
  //  * @return {{start: number, end: number}}
  //  */
  // function pageToInterval(page, total) {
  //   var PER_PAGE = 10;
  //   if ((page-1) * PER_PAGE >= total)
  //     return null;
  //   else
  //     return {start: (page-1) * PER_PAGE, end: _.min([total, page * PER_PAGE])};
  // }

  var PER_PAGE = 10;

  /**
   * response with article list of all articles within a specified page number
   * page is specified in query string like this: ?page=4 (default to 1 if absent)
   * response format is {articles: Array.<Article>}
   * see updateArticle in db.js for the type of Article
   */
  function routeIndex(req, res) {
    var page = req.query.page ? parseInt(req.query.page) : 1;
    var search = req.query.search;

    async.waterfall([
      function(cb) {
        if (search) {
          blogCollection.find(
            {'content': new RegExp(search)},
            {'_id': 0, 'content': 0},
            {limit: PER_PAGE, skip: (page-1)*PER_PAGE, sort: {'mtime': -1}}).toArray(cb);
        } else {
          blogCollection.find(
            {},
            {'_id': 0, 'content': 0},
            {limit: PER_PAGE, skip: (page-1)*PER_PAGE, sort: {'mtime': -1}}).toArray(cb);
        }
      },
      function(articles, cb) {
        if (articles.length === 0) {res.send(404); return;}
        res.set('Last-Modified', (new Date(articles[0].mtime)).toGMTString());
        res.json({articles: articles});
      }
    ], function(err) {
      if (err) {req.next(err); return;}
    });
  }

  // same as exports.index, except that response only contains article list of a particular category
  function routeCategory(req, res) {
    var category = req.params[0],
        page = req.query.page ? parseInt(req.query.page) : 1;

    async.waterfall([
      function(cb) {
        getCategories(cb);
      },
      function(categories, cb) {
        if (!(category in categories)) {res.send(404); return;}
        blogCollection.find(
          {'category': category},
          {'_id': 0, 'content': 0},
          {limit: PER_PAGE, skip: (page-1)*PER_PAGE, sort: {'mtime': -1}}).toArray(cb);
      },
      function(articles, cb) {
        if (articles.length === 0) {res.send(404); return;}
        res.set('Last-Modified', (new Date(articles[0].mtime)).toGMTString());
        res.json({articles: articles});
      }
    ], function(err) {
      if (err) {req.next(err); return;}
    });
  }

  /**
   * response with an article, response format is {article: Article}
   * see updateArticle in db.js for the type of Article
   */
  function routeArticle(req, res) {
    var category = req.params[0],
        slug = req.params[1];

    async.waterfall([
      function(cb) {
        getCategories(cb);
      },
      function(categories, cb) {
        if (!(category in categories)) {res.send(404); return;}
        blogCollection.find(
          {'category': category, 'slug': slug},
          {'_id': 0}).toArray(cb);
      },
      function(articles, cb) {
        if (articles.length === 0) {res.send(404); return;}

        var article;
        if (articles.length > 1) // just in case db is not completely sanitized
          article = _.max(articles, function(article) {return article.mtime;});
        else
          article = articles[0];

        res.set('Last-Modified', (new Date(article.mtime)).toGMTString());
        res.json({article: article});
      }
    ], function(err) {
      if (err) {req.next(err); return;}
    });
  }

  /**
   * A middleware intercepting all requests with a ?_escaped_fragment= query param. We'll return a static html file
   * to crawlers rather than a page containing JavaScript generated content.
   * @see https://developers.google.com/webmasters/ajax-crawling/docs/specification
   */
  function ajaxCrawling(req, res, next) {
    if (!req.query._escaped_fragment_) {next(); return;}

    var content = '',
        url =  req.protocol + '://' + req.get('Host') + urlPrefix + '/index.html#!' + req.query._escaped_fragment_,
        phantom = require('child_process').spawn('phantomjs', [__dirname + '/phantom-script.js', url]);

    phantom.stdout.setEncoding('utf8');
    phantom.stdout.on('data', function(data) {
      content += data.toString();
    });
    phantom.stderr.on('data', function(data) {
      console.log('stderr: ' + data);
    });
    phantom.on('exit', function(code) {
      if (code !== 0) {
        res.send(500);
      } else {
        res.send(content);
      }
    });
  }

  // construct blogApp object
  var blogApp = express();

  blogApp.configure(function(){
    blogApp.use(express.logger('dev'));
    blogApp.use(ajaxCrawling);
    blogApp.use(blogApp.router);
    blogApp.use(express.static(staticDir, {maxAge: 3600000*24}));
  });

  blogApp.configure('development', function(){
    blogApp.use(express.errorHandler());
  });

  // an express routing middleware to insert trailing slashes into urls (after path, before query string and hash) and redirect
  function appendSlashRedirect(req, res, next) {
    if (req.path[req.path.length-1] !== '/') {
      res.writeHead(301, {'Location': urlPrefix + req.path + '/' + req.url.substr(req.path.length)});
      res.end();
      return;
    }
    next();
  }

  // index.html is served by express.static middleware, which loads the frontend single-page app
  // #! is always present to help crawlers identifying pages of dynamic content
  blogApp.get('/', function(req, res) {
    res.writeHead(301, {'Location': urlPrefix + '/index.html#!/'});
    res.end();
    return;
  });

  blogApp.get(/^\/api\/categories\/?$/, appendSlashRedirect, routeCategories);
  blogApp.get(/^\/api\/articles\/?$/, appendSlashRedirect, routeIndex);
  blogApp.get(/^\/api\/articles\/([a-z0-9-]+)\/?$/, appendSlashRedirect, routeCategory);
  blogApp.get(/^\/api\/article\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/, appendSlashRedirect, routeArticle);
  blogApp.get(/^\/api\/article\/([a-z0-9-]+\/[a-z0-9-]+\/.+\.[a-zA-Z0-9]{1,4})$/, function(req, res) {
    res.sendfile(req.params[0], {root: articlesDir, maxAge: 3600000*24});
  });

  return blogApp;
};
