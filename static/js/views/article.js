define([
  'jquery',
  'underscore',
  'backbone',
  'shCore',
  'models/article',
  'text!templates/article.html',
  'libs/syntaxhighlighter-3.0.83-amd/shBrushBash',
  'libs/syntaxhighlighter-3.0.83-amd/shBrushCpp',
  'libs/syntaxhighlighter-3.0.83-amd/shBrushJScript',
  'libs/syntaxhighlighter-3.0.83-amd/shBrushPlain',
  'libs/syntaxhighlighter-3.0.83-amd/shBrushPython',
  'libs/syntaxhighlighter-3.0.83-amd/shBrushXml'
], function($, _, Backbone, shCore, Article, articleTemplate){
  var ArticleView = Backbone.View.extend({
    initialize: function() {
      this.model = new Article({ category: this.options.category, slug: this.options.slug });
    },
    template: _.template(articleTemplate),
    el: '#main',
    render: function() {
      this.model.fetch(
        {success:
         _.bind(function(model, response) {
           $('html head title').text('Sean\'s Blog - ' + response.article.title);
           this.$el.html(this.template(response));
           shCore.SyntaxHighlighter.config.tagName = 'code';
           shCore.SyntaxHighlighter.highlight();
         }, this)
        }
      );
    }
  });

  return ArticleView;
});
