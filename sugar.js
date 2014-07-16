define(['breeze'], function(breeze){

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
      var propName, operator, value;
      for (var key in criteria) {
          if (key == '__full__' || key == '__observable__') {
              continue;
          }
          propName = key;
          value = criteria[key];
          operator = self.prepareOperator(key);
          if (operator == 'or' || operator == 'and') {
              var predicatesInner = [];
              for (var i = 0; i < value.length; i++) {
                  predicatesInner = predicatesInner.concat(self.getPredicates(value[i]));
              }
              predicates.push(Predicate[operator](predicatesInner));
              continue;
          }
          if (typeof value === "object") {
              var keys = Object.keys(value);
              operator = keys[0];
              value = value[operator];
              operator = self.prepareOperator(operator);
          }
          else {
              operator = 'eq';
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
});
