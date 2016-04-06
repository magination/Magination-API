var mongoose = require('mongoose');
var User = require('../../../server/models/user/user.model');
var assert = require('assert');
var testconfig = require('../../test.config');

var currentUser = null;

after(function (done) {
	mongoose.connection.db.dropDatabase();
	done();
});

it('saves a user', function (done) {
	var newUser = new User(testconfig.USER_TESTUSER);
	currentUser = newUser;
	newUser.save(function (err) {
		if (err) throw err;
		User.find({}, function (err, doc) {
			if (err) throw err;
			assert.notEqual(doc, false);
			done();
		});
	});
});

it('finds a user by username', function (done) {
	User.find({username: testconfig.USER_TESTUSER.username}, function (err, doc) {
		if (err) throw err;
		assert.notEqual(doc, false);
		done();
	});
});

it('finds a user by email', function (done) {
	User.find({email: testconfig.USER_TESTUSER.email}, function (err, doc) {
		if (err) throw err;
		assert.notEqual(doc, false);
		done();
	});
});

it('finds a user by id', function (done) {
	User.find({_id: currentUser._id}, function (err, doc) {
		if (err) throw err;
		assert.notEqual(doc, false);
		done();
	});
});

it('removes a user by id', function (done) {
	User.remove({_id: currentUser._id}, function (err, removed) {
		if (err) throw err;
		assert.notEqual(removed, false);
		done();
	});
});

