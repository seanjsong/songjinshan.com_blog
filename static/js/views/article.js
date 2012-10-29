define([
  'jquery',
  'underscore',
  'backbone',
  'js/models/article.js',
  'text!templates/article.html'
], function($, _, Backbone, Article, articleTemplate){
  var ArticleView = Backbone.View.extend({
    initialize: function () {
      this.model = new Article({ category: this.options.category, slug: this.options.slug });
    },
    template: _.template(articleTemplate),
    el: '#main',
    render: function () {
      var el = $(this.el);
      var tmpl = this.template;
      this.model.fetch({success: function (model, response) {
        el.html(tmpl(response));
        SyntaxHighlighter.config.tagName = 'code';
        SyntaxHighlighter.highlight();
      }});
    }
  });

  return ArticleView;
});
