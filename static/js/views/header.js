define([
  'jquery',
  'underscore',
  'backbone',
  'js/models/categories.js',
  'text!templates/header.html'
], function($, _, Backbone, Categories, headerTemplate){
  var HeaderView = Backbone.View.extend({
    model: new Categories(),
    template: _.template(headerTemplate),
    el: '#header',
    render: function () {
      var el = $(this.el);
      var tmpl = this.template;
      this.model.fetch({success: function (model, response) {
        el.html(tmpl(response));
      }});
    }
  });

  return HeaderView;
});
