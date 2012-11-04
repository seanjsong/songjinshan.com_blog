define([
  'jquery',
  'underscore',
  'backbone',
  'js/models/article.js',
  'text!templates/article.html'
], function($, _, Backbone, Article, articleTemplate){
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
           SyntaxHighlighter.config.tagName = 'code';
           SyntaxHighlighter.highlight();
         }, this)
        }
      );
    }
  });

  return ArticleView;
});
