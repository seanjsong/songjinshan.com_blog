define([
  'jquery',
  'underscore',
  'backbone',
  'models/categories',
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
           $('a[href="' + window.location.hash + '"]').addClass('currentCategory');
         }, this)
        }
      );
    },
    events: {
      'click a': 'highlightMenuItem'
    },
    highlightMenuItem: function(ev) {
      $('.currentCategory').removeClass('currentCategory');
      $(ev.currentTarget).addClass('currentCategory');
    }
  });

  return HeaderView;
});
