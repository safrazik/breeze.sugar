(function (factory) {
    if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        // CommonJS or Node: hard-coded dependency on "breeze"
        factory(require("breeze"));
    } else if (typeof define === "function" && define["amd"]) {
        // AMD anonymous module with hard-coded dependency on "breeze"
        define(["breeze"], factory);
    } else {
        // <script> tag: use the global `breeze` object
        window.sugar = factory(breeze);
    }
}(function (breeze) {

  var Predicate = breeze.Predicate;
  var EntityQuery = breeze.EntityQuery;

  var SugarQuery = function SugarQuery(){
    var self = this;
    self.prepareOperator = function(operator) {
        return operator.replace(/^\$/, '');
    }
    self.getPredicates = function(criteria) {
      var predicates = [];
      if(!criteria){
        return predicates;
      }
      var propName, $operator, operator, value;
      for (var key in criteria) {
          if (key == '__full__' || key == '__observable__') {
              continue;
          }
          propName = key;
          value = criteria[key];
        
          var $operator = key;
          operator = self.prepareOperator($operator);
          if (operator == 'or' || operator == 'and') {
              var predicatesInner = [];
              for (var i = 0; i < value.length; i++) {
                  predicatesInner = predicatesInner.concat(self.getPredicates(value[i]));
              }
              predicates.push(Predicate[operator](predicatesInner));
              continue;
          }
          if (value && typeof value === "object") {
              var keys = Object.keys(value);
              $operator = keys[0];
              value = value[$operator];
              operator = self.prepareOperator($operator);
          }
          else {
              operator = 'eq';
          }
          if($operator == '$any' || $operator == '$elemMatch'){
            predicates.push(new Predicate(key, 'any', Predicate.and(self.getPredicates(value))));
            continue;
          }
          else if($operator == '$all'){
            predicates.push(new Predicate(key, 'all', Predicate.and(self.getPredicates(value))));
            continue;
          }
          predicates.push(new Predicate(propName, operator, value));
      }
      return predicates;
    }
    self.createQuery = function(resourceName, criteria, options) {
      options = options || {};
      var where = Predicate.and(self.getPredicates(criteria));
      var query = new EntityQuery().from(resourceName)
              .where(where);
      if (options.sort) {
        var orderBy = [];
        for (var key in options.sort) {
          if (options.sort[key] == -1) {
            orderBy.push(key + ' desc');
          }
          else if (options.sort[key] == 1) {
            orderBy.push(key);
          }
        }
        if (orderBy.length) {
          query = query.orderBy(orderBy.join(','));
        }
      }
      if (options.expand) {
        var expand = [];
        for (var key in options.expand) {
          if (options.expand[key]) {
            expand.push(key);
          }
        }
        if (expand.length) {
          query = query.expand(expand);
        }
      }

      if (options.skip) {
        query = query.skip(options.skip);
      }
      if (options.limit) {
        query = query.top(options.limit);
      }
      return query;
    }
  };
  return new SugarQuery();
}));