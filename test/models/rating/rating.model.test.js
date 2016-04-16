var Rating = require('../../../server/models/rating/rating.model');
var User = require('../../../server/models/user/user.model');
var Game = require('../../../server/models/game/game.model');
var testconfig = require('../../test.config');
var mongoose = require('mongoose');
var assert = require('chai').assert;
var should = require('chai').should();
var dbConfig = require('../../../server/config/db.config');
var clearDB = require('mocha-mongoose')(dbConfig.DATABASE.test, {noClear: true});

var currentUser = null;
var currentGame = null;
var currentRating = null;

before(function (done) {
	var newUser = new User(testconfig.USER_TESTUSER);
	newUser.save();
	currentUser = newUser;
	var newGame = new Game({title: 'testTitle', shortDescription: 'this is a short description', mainDescription: 'this is the maindescription', owner: newUser._id});
	currentGame = newGame;
	newGame.save(done);
});

after(function (done) {
	clearDB(done);
});

it('saves a rating', function (done) {
	currentRating = new Rating({_userId: currentUser._id, _gameId: currentGame._id, rating: 5});
	currentRating.save(done);
});

it('finds a rating by id', function (done) {
	Rating.findById(currentRating._id, function (err, rating) {
		if (err) return done(err);
		rating.should.not.be.empty;
		done();
	});
});

it('removes a comment by id', function (done) {
	Rating.remove({_id: currentRating._id}, function (err) {
		if (err) throw err;
		done();
	});
});

it('does not find a comment with non-existant id', function (done) {
	Rating.findById(currentRating._id, function (err, comment) {
		if (err) return done(err);
		assert.isNull(comment);
		done();
	});
});
