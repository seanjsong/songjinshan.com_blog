define([
  'jquery',
  'underscore',
  'backbone'
], function($, _, Backbone){
  var Articles = Backbone.Collection.extend({
    url: function() {
      return 'api/articles/' + (this.category ? this.category + '/' : '') + '?page=' + this.page;
    },
    parse: function(resp, xhr) {
      return resp.articles;
    },
    page: 1
  });
  return Articles;
});
