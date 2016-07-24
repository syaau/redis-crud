'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const fakeRedis = require('then-fakeredis');

const database = fakeRedis.createClient();
const generateModel = require('../src/generateModel');

const TestModel = generateModel(database, 'test');

describe('check generateModel basic functionality', function () {
  it('checks standard operation', function () {
    return TestModel.insert({
      attr1: 'Attribute 1',
      attr2: 'Attribute 2',
    }).then(id => {
      return TestModel.get(id);
    }).then(obj => {
      console.log('Stored Object is ', obj);
      const id = TestModel.getId(obj);
      expect(obj.attr1).to.equal('Attribute 1');
      expect(obj.attr2).to.equal('Attribute 2');
      return TestModel.update(id, { attr2: 'Changed' }).then((res) => {
        expect(res).to.equal(true);
        return TestModel.get(id);
      });
    }).then(obj => {
      expect(obj.attr1).to.equal('Attribute 1');
      expect(obj.attr2).to.equal('Changed');
      const id = TestModel.getId(obj);
      return TestModel.delete(id).then(() => {
        // The get should not return null
        return TestModel.get(id);
      }).then(res => {
        expect(res).to.equal(null);
        return TestModel.update(id, {});
      }).then(res => {
        expect(res).to.equal(false);
      });
    });
  });

  it('checks before/after hooks', function () {
    var checkMethod = sinon.spy();
    TestModel.beforeInsert = function (obj) {
      checkMethod();
    };

    TestModel.afterInsert = function (obj) {
      checkMethod();
    };

    TestModel.beforeDelete = function (obj) {
      checkMethod();
    };

    TestModel.afterDelete = function (obj) {
      checkMethod();
    };

    TestModel.beforeUpdate = function (obj) {
      checkMethod();
    };

    TestModel.afterUpdate = function (obj) {
      checkMethod();
    };

    return TestModel.insert({ attr1: 'Round 2' }).then((id) => {
      return TestModel.update(id, { attr1: 'Round 2 update' }).then(() => {
        return TestModel.delete(id).then(() => {
          expect(checkMethod.callCount).equals(6);
        });
      });
    });
  });

  it('checks iteration', function () {
    const iterator = TestModel.iterate(15);

    return iterator.next().then(res => {
      console.log('Iterator returned ', res);
    });

  });
});
