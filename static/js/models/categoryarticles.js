define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var CategoryArticles = Backbone.Model.extend({
    initialize: function () {
      this.url = 'api/articles/' + (this.get('category') ? this.get('category') + '/' : '');
    }
  });
  return CategoryArticles;
});
