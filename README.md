# songjinshan.com_blog

A single-page app utilizing [mdblog](https://github.com/seansoong/mdblog.git) as its backend.

## Installation

```
$ git clone https://github.com/seansoong/songjinshan.com_blog.git
$ cd songjinshan.com_blog
$ npm install
$ npm install -g requirejs
$ r.js -o build.js
```

## Run

Install Riak first, set port to 8098 and run. Then: 

```
$ cd songjinshan.com_blog
$ node app
```

## TODO

* disqus is no longer functional in single-page app, need a way to fix it
