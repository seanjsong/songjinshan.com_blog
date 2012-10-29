// Filename: router.js
define([
  'jquery',
  'underscore',
  'backbone',
  'vm'
], function ($, _, Backbone, Vm) {
  var AppRouter = Backbone.Router.extend({
    routes: {
      // Pages
      '!/:category/': 'category',
      '!/:category/:slug/': 'article',
      
      // Default - catch all
      '*actions': 'defaultAction'
    }
  });

  var initialize = function(options){
    var appView = options.appView;
    var router = new AppRouter(options);
    router.on('route:category', function (category) {
      require(['views/main'], function (MainView) {
        var mainView = Vm.create(appView, 'MainView', MainView, { category: category });
        mainView.render();
      });
    });
    router.on('route:article', function (category, slug) {
      require(['views/article'], function (ArticleView) {
        var articleView = Vm.create(appView, 'ArticleView', ArticleView, { category: category, slug: slug });
        articleView.render();
      });
    });
    router.on('route:defaultAction', function (actions) {
      require(['views/main'], function (MainView) {
        var mainView = Vm.create(appView, 'MainView', MainView);
        mainView.render();
      });
    });
    Backbone.history.start();
  };
  return {
    initialize: initialize
  };
});
