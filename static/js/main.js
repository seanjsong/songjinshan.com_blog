require(
  {
    paths: {
      text: 'libs/require/text-2.0.3',         // Require.js plugins
      jquery: 'libs/jquery-1.8.3',
      underscore: 'libs/underscore-1.4.1-amd', // https://github.com/amdjs
      backbone: 'libs/backbone-0.9.2-amd',     // https://github.com/amdjs
      XRegExp: 'libs/xregexp-1.5.1-amd',       // version 1.5.1 is required by SyntaxHighlighter
      shCore: 'libs/syntaxhighlighter-3.0.83-amd/shCore', // aka SyntaxHighlighter, name 'shCore' required by various syntax brushes
      templates: '../templates' // Just a short cut so we can put our html outside the js dir
    }
  },
  [
    'views/app',
    'router',
    'vm'
  ],
  function(AppView, Router, Vm) {
    var appView = Vm.create({}, 'AppView', AppView);
    appView.render();
    Router.initialize({appView: appView});
  }
);
