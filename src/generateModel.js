'use strict';

const ID = '__id__';

module.exports = function (redis, name) {
  const NAME = '__' + name + '__';

  const KEY = function (id) {
    return NAME + ':' + id;
  };

  return {
    insert(obj) {
      // run the beforeInsert hook
      let before;
      try {
        before = this.beforeInsert && this.beforeInsert(obj);
      } catch (e) {
        return Promise.reject(e);
      }

      return Promise.resolve(before).then(() => {
        // Get the incremental id for the record
        return redis.incr(NAME).then(id => {
          const args = [KEY(id), ID, id];
          Object.keys(obj).forEach(attr => {
            args.push(attr);
            args.push(obj[attr]);
          });

          // Add the record
          return redis.hmset.apply(redis, args).then(res => {
            if (res === 'OK') {
              // Run the afterInsert hook
              const after = this.afterInsert && this.afterInsert(obj, id);
              return Promise.resolve(after).then(() => {
                return id;
              });
            } else {
              throw new Error(`Could not create object for ${name}. The server says ${res}`);
            }
          });
        });
      });
    },

    iterate(limit) {
      let _cursor = 0;
      let _eof = false;

      // Return the object that should be used for retrieved data
      return {
        get eof() {
          return _eof;
        },

        next: function () {
          // Return null if eof has been reached already
          if (_eof) {
            return Promise.resolve(null);
          }

          const records = [];
          function yieldResult(count) {
            return redis.scan(_cursor, 'match', KEY('*'), 'count', count).then(res => {
              // Update the cursor for further calls
              _cursor = parseInt(res[0]);

              // Append the result obtained into the final records list
              if (res[1].length > 0) {
                records.push.apply(records, res[1]);
              }

              // Check if we have reached the end of the list or
              // got the maximum number of records for each request
              if (_cursor === 0) {
                _eof = true;
                return records;
              } else if (records.length === limit) {
                return records;
              } else {
                return yieldResult(limit - records.length);
              }
            });
          }

          return yieldResult(limit);
        },
      };
    },

    get(id) {
      const key = KEY(id);

      // only return if the key exists
      return redis.exists(key).then(res => {
        if (res === 0) {
          // Record not found
          return null;
        }

        return redis.hgetall(key);
      });
    },

    getId(obj) {
      return obj[ID];
    },

    delete(id) {
      const key = KEY(id);

      // Only run if the record already exists
      return redis.exists(key).then(res => {
        if (res === 0)
          return false;

        // Retrieve the object being deleted
        return redis.hgetall(key);
      }).then((obj) => {
        // Run the beforeDelete hook
        return Promise.resolve(this.beforeDelete && this.beforeDelete(id, obj)).then(() => {
          return redis.del(key).then(() => {
            return Promise.resolve(this.afterDelete && this.afterDelete(id, obj));
          });
        });
      }).then(() => {
        return true;
      });
    },

    update(id, obj) {
      const key = KEY(id);

      // The operation can be performed only if the record exists already
      return redis.exists(key).then(res => {
        if (res === 0)
          return false;

        // run the before hook
        return Promise.resolve(this.beforeUpdate && this.beforeUpdate(id, obj)).then(() => {
          const args = [key];
          Object.keys(obj).forEach(attr => {
            args.push(attr);
            args.push(obj[attr]);
          });

          return redis.hmset.apply(redis, args).then(res => {
            if (res === 'OK') {
              // run the after hook
              const after = this.afterUpdate && this.afterUpdate(id, obj);
              return Promise.resolve(after).then(() => true);
            } else {
              throw new Error(`Could not update object for ${name} with id ${id}.` +
                  ` The server said ${res}`);
            }
          });
        });
      });
    },
  };
};
