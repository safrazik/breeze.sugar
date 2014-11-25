(function (factory) {
    if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        // CommonJS or Node: hard-coded dependency on "breeze"
        factory(require("Q"), require("breeze"), require("breeze.sugar"));
    } else if (typeof define === "function" && define["amd"]) {
        // AMD anonymous module with hard-coded dependency on "breeze"
        define(["Q", "breeze", "breeze.sugar"], factory);
    } else {
        // <script> tag: use the global `breeze` object
        window.DataService = factory(Q, breeze, sugar);
    }
}(function (Q, breeze, sugar) {

	var _queriesFetched = new Map();

	var EntityManager = breeze.EntityManager,
		EntityQuery = breeze.EntityQuery,
		EntityState = breeze.EntityState,
		Predicate = breeze.Predicate,
		FetchStrategy = breeze.FetchStrategy;

	var DataService = function(entityManager){

	  var self = this;

	  self.entityManager = entityManager;

	  self.findAll = function(from, criteria, options){
	  	criteria = criteria || {}; options = options || {};
	    var queryId = JSON.stringify({from: from, criteria: criteria, options: options});
	    var query = sugar.createQuery(from, criteria, options);
	    if(options.count){
	      query = query.inlineCount(true);
	    }
	    var localFirst = options.localFirst;
	    if(options.expand && !_queriesFetched.get(queryId)){
	      localFirst = false;
	    }
	    _queriesFetched.set(queryId, true);
	    
	    var deferred = Q.defer();
	    
	    var findFromServer = true;
	    if(localFirst !== false){
	      var results = self.getAll(from, criteria, options);
	      if(results.length){
	        deferred.resolve(results);
	        findFromServer = false;
	      }
	    }
	    if(findFromServer) {
	      self.findResultsByQuery(query, false, false, true).then((results)=> {
	        if(localFirst === false){
	          deferred.resolve(results);
	        }
	        else {
	          deferred.resolve(self.getAll(from, criteria, options, results.count));
	        }
	      });
	    }
	    return deferred.promise;
	  }

	  self.findOne = function(from, criteria, options){
	  	options = options || {};
	    options.limit = 1;
	    var queryId = JSON.stringify({from: from, criteria: criteria, options: options});
	    var queryIdOne = 'ONE:' + queryId;
	    var query = sugar.createQuery(from, criteria, options);
	    if(options.expand && (!_queriesFetched.get(queryId) || _queriesFetched.get(queryIdOne))){
	      options.localFirst = false;
	    }
	    _queriesFetched.set(queryIdOne, query);
	    return self.findResultsByQuery(query, options.localFirst !== false, true, true);
	  }

	  self.getAll = function(from, criteria, options, inlineCount){
	  	options = options || {}; inlineCount = inlineCount || null;
	    var queryId = JSON.stringify({from: from, criteria: criteria, options: options});
	    var query = sugar.createQuery(from, criteria, options);
	    var results = self.getResults(query, false);
	    if(options.count){
	      var countOptions = {
	        sort: options.sort,
	      }
	      var countQuery = sugar.createQuery(from, criteria, countOptions);
	      var allResults = self.getResults(countQuery, false);
	      results.count = allResults.length;
	      if(inlineCount > results.count){
	        results.count = inlineCount;
	      }
	    }
	    return results;
	  }

	  self.getOne = function(from, criteria, options){
	  	options = options || {};
	    options.limit = 1;
	    var query = sugar.createQuery(from, criteria, options);
	    return self.getResults(query, true);
	  }

	  self.create = function(entityTypeName, data){
	    return self.entityManager.createEntity(entityTypeName, data);    
	  }

	  self.getResults = function(query, singleResult){
	  	singleResult = singleResult || false;
	    try {
	      var results = self.entityManager.executeQueryLocally(query);
	      return singleResult ? results[0] : results;
	    }
	    catch(e){
	      console.log(e);
	      console.log(e.stack);
	      return singleResult ? null : [];
	    }
	  }

	  self.findResultsByQuery = function(query, localFirst, singleResult, resultsOnly) {
	  	localFirst = localFirst !== false;
	  	singleResult = singleResult || false;
	  	resultsOnly = resultsOnly !== false;
	    var deferred = Q.defer();
	    var results = [];
	    if(localFirst){
	        results = self.getResults(query, singleResult) || [];
	        if(results.length){
	            deferred.resolve(resultsOnly ? results : {results: results});
	        }
	    }
	    if(!localFirst || !results.length){
	        self.entityManager.executeQuery(query).then(function(data){
	          if(data.inlineCount){
	            data.results.count = data.inlineCount;
	          }
	          deferred.resolve(singleResult ? data.results[0] : (resultsOnly ? data.results : data));
	        }, function(error){
	            deferred.reject(error);
	        });
	    }
	    return deferred.promise;
	  }

	  self.remove = function(entity){
	    if(entity.entityAspect){
	      entity.entityAspect.setDeleted();
	    }
	  }

	  self.saveChanges = function(entities){
	    if(entities){
	      var deletedEntities = self.entityManager.getEntities(null, EntityState.Deleted);
	      entities = entities.concat(deletedEntities);
	      return self.entityManager.saveChanges(entities);
	    }
	    else {
	      return self.entityManager.saveChanges();
	    }
	  }
	  
	}

	return DataService;

}));