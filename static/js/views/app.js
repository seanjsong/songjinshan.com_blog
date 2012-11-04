define([
  'jquery',
  'underscore',
  'backbone',
  'vm',
  'events',
  'text!templates/layout.html'
], function($, _, Backbone, Vm, Events, layoutTemplate){
  var AppView = Backbone.View.extend({
    el: '#container',
    render: function() {
      this.$el.html(layoutTemplate);
      require(['views/header'], _.bind(function(HeaderView) {
        var headerView = Vm.create(this, 'HeaderView', HeaderView);
        headerView.render();
      }, this));
    }
  });

  return AppView;
});
