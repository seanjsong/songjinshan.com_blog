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
        $('a[href="' + window.location.hash + '"]').addClass('active');
      }});
    },
    events: {
      'click a': 'highlightMenuItem'
    },
    highlightMenuItem: function (ev) {
      $('.active').removeClass('active');
      $(ev.currentTarget).addClass('active');
    }
  });

  return HeaderView;
});
