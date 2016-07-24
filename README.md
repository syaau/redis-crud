# redis-crud
A very simple library for generating models that uses REDIS as the database
and provides the basic CRUD functionality.

### Usage
```javascript
const redis = require('then-redis');
const db = redis.createClient();
const generateModel = require('redis-crud').generateModel;

const UserModel = generateModel('User');

// Insert a new record and get the serial id using promise
UserModel.insert({username: 'admin', password: 'pwd'}).then(id => {
  console.log('New record id is ', id);
});

// Retrieve the record
UserModel.get(1).then(obj => {
  console.log('The record at 1 is ', obj);
});

// Update the record
UserModel.update(1, { name: 'John Doe' }).then(() => {
  // The record is updated
});

// Delete the record
UserModel.delete(1).then(res => {
  // The record is deleted
});

// Iterate through all the records, providing the number of records to
// retrieve on each iteration
const iterator = UserModel.iterate(10);
iterator.next().then(records => {
  // The list of records are available here
});
```
### Using hooks
```javascript
const UserModel = require('redis-crud').generatorModel(db, 'User');

// The hook invoked before a new record is inserted, with the object instance
// that is being inserted. Throw an error here to avoid the record from
// being inserted
UserModel.beforeInsert = function(obj) {

};

// The hook invoked after the record is inserted. The hook is provided with
// the new id of the record. Do the post record insertion operations here,
// like create secondary records for easy data retrieval based on certain
// properties
UserModel.afterInsert = function(obj, id) {

};

// The hook invoked before the record is updated. The obj provides the
// properties that are going to be updated (either new or old). Throwing an
// exception here will stop the record from being updated
UserModel.beforeUpdate = function(id, obj) {

};

// The hook invoked after the record is updated. The parameters are same as
// the ones provided in beforeUpdate
UserModel.afterUpdate = function(id, obj) {

};

// The hook invoked before the record is deleted. The obj provides the object
// in the database that is going to be removed. Throwing an exception here will
// stop the record from being deleted
UserModel.beforeDelete = function(id, obj) {

};

// The hook invoked after the record is deleted.
UserModel.afterDelete = function(id, obj) {

};
```
