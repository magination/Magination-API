var User = require('../../../server/models/user/user.model');
var GameCreator = require('../../../server/models/gameCreator/gameCreator.model');
var testconfig = require('../../test.config');
var mongoose = require('mongoose');
var assert = require('chai').assert;
var should = require('chai').should();
var dbConfig = require('../../../server/config/db.config');
var clearDB = require('mocha-mongoose')(dbConfig.DATABASE.test, {noClear: true});

var currentUser = null;
var currentGameCreator = null;

before(function (done) {
	currentUser = new User(testconfig.USER_TESTUSER);
	currentUser.save(done);
});

after(function (done) {
	clearDB(done);
});

it('saves a gameCreator', function (done) {
	currentGameCreator = new GameCreator({json: 'this is json', owner: currentUser._id});
	currentGameCreator.save(done);
});

it('finds a gameCreator by id', function (done) {
	GameCreator.findById(currentGameCreator._id, function (err, gameCreator) {
		if (err) return done(err);
		gameCreator.should.not.be.empty;
		done();
	});
});

it('removes a gameCreator by id', function (done) {
	GameCreator.remove({_id: currentGameCreator._id}, function (err) {
		if (err) throw err;
		done();
	});
});

it('does not find a gameCreator with non-existant id', function (done) {
	GameCreator.findById(currentGameCreator._id, function (err, gameCreator) {
		if (err) return done(err);
		assert.isNull(gameCreator);
		done();
	});
});
