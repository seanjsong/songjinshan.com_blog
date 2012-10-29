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
    render: function () {
      var that = this;
      $(this.el).html(layoutTemplate);
      require(['views/header'], function (HeaderView) {
        var headerView = Vm.create(that, 'HeaderView', HeaderView);
        headerView.render();
      });
    }
  });

  return AppView;
});
