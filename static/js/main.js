require.config({
  paths: {
    jquery: 'libs/jquery-min',
    underscore: 'libs/underscore-min', // https://github.com/amdjs
    backbone: 'libs/backbone-min',     // https://github.com/amdjs
    text: 'libs/require/text',         // Require.js plugins
    templates: '../templates' // Just a short cut so we can put our html outside the js dir
  }
});

require([
  'views/app',
  'router',
  'vm'
], function(AppView, Router, Vm){
  var appView = Vm.create({}, 'AppView', AppView);
  appView.render();
  Router.initialize({appView: appView});
});
