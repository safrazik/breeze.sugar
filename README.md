breeze.sugar
============

Syntax sugar ([Mongo DB style queries](http://docs.mongodb.org/manual/tutorial/query-documents/)) for [breeze js](http://www.breezejs.com/)

API
---

```
createQuery(resourceName [, criteria [, options ]])
```

Create an EntityQuery in mongodb style

### Arguments
- `resourceName` String
   entityType's resource name to query from
- `criteria` Object
   Mongodb style query criteria
- `options` Object
   - `sort` Object
      Sort order
   - `skip` Number
      Number of results to skip at the beginning
   - `limit` Number
      Maximum number of results to return
   - `expand` Object
      The navigation properties to expand

### Returns
[breeze.EntityQuery](http://www.breezejs.com/sites/all/apidocs/classes/EntityQuery.html)

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
    }, expand: {
      country: true
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
.orderBy('name desc')
.expand('country');
```
