var Game = require('../../../server/models/game/game.model');
var User = require('../../../server/models/user/user.model');
var testconfig = require('../../test.config');
var mongoose = require('mongoose');
var assert = require('assert');
var currentGame = null;

before(function (done) {
	/*
	This looks weird, but is done to get a valid user_id, which is used when creating a new game.
	 */
	var newUser = new User(testconfig.USER_TESTUSER);
	newUser.save();
	var newGame = new Game({title: 'testTitle', shortDescription: 'this is a short description', mainDescription: 'this is the maindescription', owner: newUser._id});
	newGame.save();
	currentGame = newGame;
	done();
});

after(function (done) {
	mongoose.connection.db.dropDatabase();
	done();
});

it('saves a game', function (done) {
	Game.find({}, function (err, doc) {
		if (err) throw err;
		assert.notEqual(doc, false);
		done();
	});
});

it('finds a game by id', function (done) {
	Game.find({_id: currentGame._id}, function (err, doc) {
		if (err) throw err;
		assert.notEqual(doc, false);
		done();
	});
});

it('removes a game by id', function (done) {
	Game.remove({_id: currentGame._id}, function (err, removed) {
		if (err) throw err;
		assert.notEqual(removed, false);
		done();
	});
});
