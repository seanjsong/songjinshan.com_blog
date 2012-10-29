define([
  'jquery',
  'underscore',
  'backbone',
  'js/models/categoryarticles.js',
  'text!templates/main.html'
], function($, _, Backbone, CategoryArticles, mainTemplate){
  var MainView = Backbone.View.extend({
    initialize: function () {
      this.model = new CategoryArticles({ category: this.options.category });
    },
    template: _.template(mainTemplate),
    el: '#main',
    render: function () {
      var el = $(this.el);
      var tmpl = this.template;
      this.model.fetch({success: function (model, response) {
        el.html(tmpl(response));
      }});
    }
  });

  return MainView;
});
