define([
  'jquery',
  'underscore',
  'backbone',
  'js/collections/articles.js',
  'text!templates/main.html'
], function($, _, Backbone, Articles, mainTemplate) {
  var MainView = Backbone.View.extend({
    initialize: function() {
      // isLoading is a useful flag to make sure we don't send off more than one request at a time
      this.blankMonthsInARow = 0;
      this.isLoading = false;
      this.articles = new Articles();
      this.articles.category = this.options.category;
      this.$el.empty();
      $('html head title').text('Sean\'s Blog' + (this.options.category ? ' - ' + this.options.category : ''));
    },
    template: _.template(mainTemplate),
    el: '#main',
    render: function() {
      this.loadResults();
    },

    loadResults: function() {
      var self = this;
      // we are starting a new load of results so set isLoading to true
      this.isLoading = true;
      // fetch is Backbone.js native function for calling and parsing the collection url
      this.articles.fetch({
        success: function (results) {
          if (results.models.length === 0) { // results is empty
            if (++self.blankMonthsInARow >= 6) {
              self.undelegateEvents(); // No further loading after blank for half a year
              self.isLoading = false;
            } else {
              self.articles.previousMonth();
              self.loadResults();
            }
          } else {              // results isn't empty
            self.blankMonthsInARow = 0;
            $(self.el).append(self.template({articles: results.models}));

            if (self.el.scrollHeight > self.$el.height()) {
              self.isLoading = false;
            } else {
              self.articles.previousMonth();
              self.loadResults();
            }
          }
        }
      });
    },

    // This will simply listen for scroll events on the current el
    events: {
      'scroll': 'checkScroll'
    },

    checkScroll: function() {
      var triggerPoint = 100; // 100px from the bottom
      if(!this.isLoading && this.el.scrollTop + this.el.clientHeight + triggerPoint > this.el.scrollHeight) {
        this.articles.previousMonth(); // Load previousMonth
        this.loadResults();
      }
    }
  });
  
  return MainView;
});
