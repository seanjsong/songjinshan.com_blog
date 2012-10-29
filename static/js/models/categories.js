define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var Categories = Backbone.Model.extend({
    url: '/blog/api/categories/'
  });
  return Categories;
});
