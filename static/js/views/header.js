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
    render: function() {
      this.model.fetch(
        {success:
         _.bind(function(model, response) {
           this.$el.html(this.template(response));
           $('a[href="' + window.location.hash + '"]').addClass('active');
         }, this)
        }
      );
    },
    events: {
      'click a': 'highlightMenuItem'
    },
    highlightMenuItem: function(ev) {
      $('.active').removeClass('active');
      $(ev.currentTarget).addClass('active');
    }
  });

  return HeaderView;
});
