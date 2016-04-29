var mongoose = require('mongoose');
var User = require('../../../server/models/user/user.model');
var UnpublishedGame = require('../../../server/models/unpublishedGame/unpublishedGame.model');
var assert = require('assert');
var testconfig = require('../../test.config');
var dbConfig = require('../../../server/config/db.config');
var clearDB = require('mocha-mongoose')(dbConfig.DATABASE.test, {noClear: true});
var currentUser = null;
var currentUnpublishedGame = null;

after(function (done) {
	clearDB(done);
});

before(function (done) {
	var newUser = new User(testconfig.USER_TESTUSER);
	currentUser = newUser;
	newUser.save(function (err) {
		if (err) return done(err);
		done();
	});
});

it('saves a unpublishedGame', function (done) {
	var unpublishedGame = new UnpublishedGame({title: 'title', shortDescription: 'short short short', owner: currentUser._id});
	currentUnpublishedGame = unpublishedGame;
	unpublishedGame.save(function (err) {
		done(err);
	});
});

it('finds a unpublishedGame by title', function (done) {
	UnpublishedGame.find({title: currentUnpublishedGame.title}, function (err, doc) {
		if (err) return done(err);
		assert.notEqual(doc, false);
		done();
	});
});

it('finds a user by shortDescription', function (done) {
	UnpublishedGame.find({shortDescription: currentUnpublishedGame.shortDescription}, function (err, doc) {
		if (err) return done(err);
		assert.notEqual(doc, false);
		done();
	});
});

it('finds a unpublishedGame by id', function (done) {
	UnpublishedGame.find({_id: currentUnpublishedGame._id}, function (err, doc) {
		if (err) return done(err);
		assert.notEqual(doc, false);
		done();
	});
});

it('removes a unpublishedGame by id', function (done) {
	UnpublishedGame.remove({_id: currentUnpublishedGame._id}, function (err, removed) {
		if (err) return done(err);
		assert.notEqual(removed, false);
		done();
	});
});

