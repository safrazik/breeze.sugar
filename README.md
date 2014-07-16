breeze.sugar
============

Syntax sugar ([Mongo DB style queries](http://docs.mongodb.org/manual/tutorial/query-documents/)) for [breeze js](http://www.breezejs.com/)

API
---

```javascript
breeze.EntityQuery createQuery(resourceName [, criteria [, options ]])
breeze.Predicate[] getPredicates(criteria)
```

Usage
-----

```javascript
var query = sugar.createQuery('Customers', {
      'country.code': 'en-US',
      $or: [
        {age: {$gt: 18}},
        {name: {$contains: 'z'}}
      ],
    },
    {limit: 10, skip: 5, sort: {
        name: -1
    }});
```

the above code is converted into:

```javascript
var query = new breeze.EntityQuery().from('Customers').where(
  breeze.Predicate.and(
    new breeze.Predicate('country.code', '==', 'en-US'),
    breeze.Predicate.or(
      new breeze.Predicate('age', 'gt', 18),
      new breeze.Predicate('name', 'contains', 'z')
    )
  )
)
.top(10)
.skip(5)
.orderBy('name desc');
```
