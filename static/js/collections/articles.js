define([
  'jquery',
  'underscore',
  'backbone'
], function($, _, Backbone){
  var Articles = Backbone.Collection.extend({
    url: function () {
      return 'api/articles/' + (this.category ? this.category + '/' : '')
        + (this.month ? '?month=' + this.month.toISOString().substring(0,7) : '');
    },
    parse: function(resp, xhr) {
      return resp.articles;
    },
    month: null,
    previousMonth: function() {
      if (!this.month)
        this.month = new Date();
      this.month.setMonth(this.month.getMonth()-1);
    }
  });
  return Articles;
});
