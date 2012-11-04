define([
  'jquery',
  'underscore',
  'backbone',
  'js/collections/articles.js',
  'text!templates/main.html'
], function($, _, Backbone, Articles, mainTemplate) {
  var MainView = Backbone.View.extend({
    initialize: function() {
      this.isLoading = false; // a flag to make sure we don't send more than one request at the same time
      this.articles = new Articles();
      this.articles.category = this.options.category;
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
      this.articles.fetch(
        {success:
         _.bind(function(results) {
           this.$el.append(this.template({articles: results.models}));
           // the first time we might need more than one page of articles
           if (this.el.scrollHeight > this.$el.height()) {
             this.isLoading = false;
           } else {
             this.articles.page++;
             this.loadResults();
           }
         }, this),
         error:
         _.bind(function() {
           this.undelegateEvents();
           this.isLoading = false;
         }, this)
        }
      );
    },

    events: {
      'scroll': 'checkScroll'
    },

    checkScroll: function() {
      var triggerPoint = 100; // start loading 100px from the bottom
      if(!this.isLoading && this.el.scrollTop + this.el.clientHeight + triggerPoint > this.el.scrollHeight) {
        this.articles.page++;
        this.loadResults();
      }
    }
  });
  
  return MainView;
});
