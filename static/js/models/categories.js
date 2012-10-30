define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var Categories = Backbone.Model.extend({
    url: 'api/categories/'
  });
  return Categories;
});
