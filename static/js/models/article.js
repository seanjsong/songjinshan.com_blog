define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var Article = Backbone.Model.extend({
    initialize: function () {
      this.url = 'api/article/' + this.get('category') + '/' + this.get('slug') + '/';
    }
  });
  return Article;
});
