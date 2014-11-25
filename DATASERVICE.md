# DataService class


Usage
-----

```javascript

// entityManager instanceof breeze.EntityManager

var dataService = new DataService(entityManager);

dataService.findAll('Customers', {
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
    }})
    .then(function(customers){
    	// do something with the customers
    });

dataService.findOne('Customer', {id: 3}).then(function(customer){
	// do something with the customer
});

var elderCustomers = dataService.getAll('Customers', {age: {$gt: 40}});

var customer = dataService.getOne('Customer', {id: 5});

```