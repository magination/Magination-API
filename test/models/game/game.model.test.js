var Game = require('../../../server/models/game/game.model');
var User = require('../../../server/models/user/user.model');
var testconfig = require('../../test.config');
var mongoose = require('mongoose');
var assert = require('assert');
var should = require('chai').should();
var dbConfig = require('../../../server/config/db.config');
var clearDB = require('mocha-mongoose')(dbConfig.DATABASE.test, {noClear: true});

var currentGame = null;

before(function (done) {
	var newUser = new User(testconfig.USER_TESTUSER);
	newUser.save();
	var newGame = new Game({title: 'testTitle', shortDescription: 'this is a short description', mainDescription: 'this is the maindescription', owner: newUser._id});
	currentGame = newGame;
	newGame.save(done);
});

after(function (done) {
	clearDB(done);
});

it('saves a game', function (done) {
	Game.find({}, function (err, game) {
		if (err) throw err;
		game.should.not.be.empty;
		done();
	});
});

it('finds a game by id', function (done) {
	Game.find({_id: currentGame._id}, function (err, game) {
		if (err) throw err;
		game.should.not.be.empty;
		done();
	});
});

it('removes a game by id', function (done) {
	Game.remove({_id: currentGame._id}, function (err, removed) {
		if (err) throw err;
		removed.should.not.be.empty;
		done();
	});
});
