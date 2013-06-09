var async = require('async'),
    fs = require('fs'),
    path = require('path'),
    marked = require('marked'),
    _ = require('underscore');

// helper function for updateDb, read subdirectory names from articlesDir as category names
function readCategories(articlesDir, cb) {
  var _files;
  async.waterfall([
    function(cb) {
      fs.readdir(articlesDir, cb);
    },
    function(files, cb) {
      _files = files;
      async.map(files,
                function(file, cb) {
                  fs.stat(path.join(articlesDir, file), cb);
                },
                cb);
    }
  ], function(err, stats) {
    if (err) {cb(err); return;}
    cb(null,
       _files.filter(function(file, i) {
         return stats[i].isDirectory();
       }));
  });
}

// helper function for updateDb, read .md files from category subdirectory as slug names
function readCategorySlugs(articlesDir, category, cb) {
  var categoryDir = path.join(articlesDir, category);
  var _files;

  async.waterfall([
    function(cb) {
      fs.readdir(categoryDir, cb);
    },
    function(files, cb) {
      _files = files;
      async.map(files,
                function(file, cb) {
                  fs.stat(path.join(categoryDir, file), cb);
                },
                cb);
    }
  ], function(err, stats) {
    if (err) {cb(err); return;}
    cb(null,
       _.zip(_files, stats).filter(function(fileStats) { // [['slug1.md', stats1], ['slug2.md', stats2] ...]
         return fileStats[1].isFile() && path.extname(fileStats[0]) === '.md';
       }).map(function(fileStats) { // [{'category1_slug1': mtime1}, {'category1_slug2': mtime2} ...]
         var o = {};
         o[category + '_' + path.basename(fileStats[0], '.md')] = fileStats[1].mtime.getTime();
         return o;
       }));
  });
}

// helper function for updateDb
function updateArticle(blogCollection, articlesDir, key, cb) {
  var keyComponents = key.split('_'),
      category = keyComponents[0],
      slug = keyComponents[1],
      mtime = parseInt(keyComponents[2]),
      articlePath = path.join(articlesDir, category, slug) + ".md";

  fs.readFile(
    articlePath,
    function(err, buf) {
      if (err) {cb(err); return;}

      /**
       * article object
       * @type {{category: string, slug: string, mtime: number, title: string, excerpt: html string, content: html string}}
       */
      var article = {_id: key, category: category, slug: slug, mtime: mtime},
          content = buf.toString(),
          titlePattern = /^# (.+)\n/g,
          titleMatch = titlePattern.exec(content);

      if (!titleMatch) {cb(new Error('Article title absent')); return;}
      article.title = titleMatch[1];

      var excerptEndPos = content.substring(titlePattern.lastIndex).search(/^## (.+)$/m);
      if (~excerptEndPos)
        article.excerpt =
          marked(content.substr(titlePattern.lastIndex, excerptEndPos).trim()).
          replace(/<code class="lang-([a-z0-9]+)">/g, '<code class="brush: $1">'); // to facilitate syntaxhighlighter on client side
      else
        article.excerpt = '';

      article.content =
        marked(content)
        .replace(/<code class="lang-([a-z0-9]+)">/g, '<code class="brush: $1">')
        .replace(/<img src="([^"]+)"/g, '<img src="' + 'api/article/' + category + '/' + slug + '/' + '$1"');

      blogCollection.insert(article, function(err) {if (!err) console.log('Saved: '+ key); cb(err);});
    });
};

exports = module.exports = function(blogCollection, articlesDir, cb) {
  async.waterfall([
    function(cb) {
      readCategories(articlesDir, cb);
    },
    function(categories, cb) {
      async.parallel({
        slugsFs: function(cb) {
          async.map(categories,
                    function(category, cb) {
                      readCategorySlugs(articlesDir, category, cb);
                    },
                    cb);
        },
        slugsDb: function(cb) {
          blogCollection.find({}, ['_id']).toArray(cb);
        }
      }, function(err, res) {
        if (err) throw err;
        // res.slugsFs: [[{'category1_slug1': mtime1}, {'category1_slug2': mtime2}], [{'category2_slug1': mtime3}], []]
        // res.slugsFs after flatten: [{'category1_slug1': mtime1}, {'category1_slug2': mtime2}, {'category2_slug1': mtime3}]
        // res.slugsFs after extend: {'category1_slug1': mtime1, 'category1_slug2': mtime2, 'category2_slug1': mtime3}
        // res.slugsDb: [{'_id': 'category1_slug1_mtime1'}, {'_id': 'category1_slug2_mtime2'},{'_id': 'category2_slug1_mtime3'}]
        // res.slugsDb after map: ['category1_slug1_mtime1', 'category1_slug2_mtime2', 'category2_slug1_mtime3']
        cb(null,
           _.extend.apply(null, _.flatten(res.slugsFs)),
           _.pluck(res.slugsDb, '_id'));
      });
    },
    function(slugsFs, slugsDb, cb) {
      function dbRemove(key) {
        blogCollection.remove({'_id': key}, function(err) {
          if (err) {console.log('Removing: ' + key + ' ' + err); return;}
          console.log('Removed: ' + key);
        });
      }

      slugsDb = slugsDb.filter(function(key) { // sanitizing step
        var keyComponents = key.split('_'),
            category = keyComponents[0],
            slug = keyComponents[1],
            mtime = parseInt(keyComponents[2]);
        if (!category || !slug || !mtime) {
          dbRemove(key);
          return false;
        } else return true;
      }).map(function(key) { // [{'category1_slug1': mtime1}, {'category1_slug2': mtime2}, {'category2_slug1': mtime3} ...]
        var keyComponents = key.split('_'),
            category = keyComponents[0],
            slug = keyComponents[1],
            mtime = parseInt(keyComponents[2]),
            o = {};
        o[category + '_' + slug] = mtime;
        return o;
      }).reduce(function(obj1, obj2) { // {'category1_slug1': mtime1, 'category1_slug2': mtime2, 'category2_slug1': mtime3 ...}
        var categorySlug = Object.keys(obj2)[0];

        if (!obj1[categorySlug]) { // extend
          obj1[categorySlug] = obj2[categorySlug];
        } else if (obj1[categorySlug] < obj2[categorySlug]) { // de-dup, remove obj1
          dbRemove(categorySlug + '_' + obj1[categorySlug]);
          obj1[categorySlug] = obj2[categorySlug];
        } else {                // de-dup, remove obj2
          dbRemove(categorySlug + '_' + obj2[categorySlug]);
        }
        return obj1;
      }, {});

      // remove invalid keys from db
      _.each(slugsDb, function(mtime, categorySlug) {
        if (!slugsFs[categorySlug] || slugsFs[categorySlug] !== mtime)
          dbRemove(categorySlug + '_' + mtime);
      });

      // save outstanding articles in fs to db
      async.each(_.pairs(slugsFs), // [['category1_slug1', mtime1], ['category1_slug2', mtime2], ['category2_slug1', mtime3]]
                 function(categorySlugPair, cb) {
                   if (!slugsDb[categorySlugPair[0]])
                     updateArticle(blogCollection, articlesDir, categorySlugPair[0] + '_' + categorySlugPair[1], cb);
                   else
                     cb(null);
                 },
                 cb);
    }
  ], function(err) {
    if (err) throw err;
    cb(null);
  });
};