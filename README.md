# songjinshan.com_blog

A single-page app utilizing [mdblog](https://github.com/seansoong/mdblog.git) as its backend.

## Installation

```
$ git clone https://github.com/seansoong/songjinshan.com_blog.git
$ cd songjinshan.com_blog
$ npm install
$ sudo npm install -g requirejs
$ r.js -o build.js
```

## Run

Install Riak first: edit Riak config file, set http port to 8098 and enable search, then start Riak.

Then:

```
$ search-cmd install blog # install riak search precommit hook for bucket "blog"
$ cd songjinshan.com_blog
$ node app
```

## TODO

* disqus is no longer functional in single-page app, need a way to fix it
* issue: when update an article and then node app, the updated article will only be removed, node app again then it will be added
* search index seems incomplete, case sensitive, and cannot paginate
