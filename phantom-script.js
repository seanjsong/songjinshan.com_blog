/**
 * @fileoverview This file is not executed by node, but by phantomjs,
 * to capture the content of a url and write to stdout.
 */

var page = require('webpage').create();
var system = require('system');

var lastReceived = new Date().getTime();
var requestCount = 0;
var responseCount = 0;
var requestIds = [];

page.onResourceReceived = function(response) {
  if(requestIds.indexOf(response.id) !== -1) {
    lastReceived = new Date().getTime();
    responseCount++;
    requestIds[requestIds.indexOf(response.id)] = null;
  }
};
page.onResourceRequested = function(request) {
  if(requestIds.indexOf(request.id) === -1) {
    requestIds.push(request.id);
    requestCount++;
  }
};

page.open(system.args[1], function() {});

var checkComplete = function() {
  if(new Date().getTime() - lastReceived > 300 && requestCount === responseCount)  {
    clearInterval(checkCompleteInterval);
    console.log(page.content);
    phantom.exit();
  }
};

var checkCompleteInterval = setInterval(checkComplete, 1);