define([
  'jquery',
  'underscore',
  'backbone',
  'collections/articles',
  'text!templates/main.html'
], function($, _, Backbone, Articles, mainTemplate) {
  var MainView = Backbone.View.extend({
    initialize: function() {
      this.isLoading = false; // a flag to make sure we don't send more than one request at the same time
      this.articles = new Articles();
      this.articles.category = this.options.category;
      this.articles.search = this.options.search;
      this.$el.empty();
      $('title').text('Sean\'s Blog' + (this.options.category ? ' - ' + this.options.category : ''));
    },
    template: _.template(mainTemplate),
    el: '#main',
    render: function() {
      this.loadResults();
    },

    loadResults: function() {
      this.isLoading = true;
      $('#showEarlier').replaceWith('<img id="loading" src="images/loading_transparent.gif"/>');
      this.articles.fetch(
        {success:
         _.bind(function(results) {
           this.$el.append(this.template({articles: results.models}));
           this.isLoading = false;
           $('#loading').remove();
         }, this),
         error:
         _.bind(function() {
           this.undelegateEvents();
           this.isLoading = false;
           $('#loading').remove();
         }, this)
        }
      );
    },

    events: {
      'click #showEarlier': 'loadMore'
    },

    loadMore: function() {
      if (!this.isLoading) {
        this.articles.page++;
        this.loadResults();
      }
    }
  });
  
  return MainView;
});
