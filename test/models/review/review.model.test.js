var Review = require('../../../server/models/review/review.model');
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
var currentReview = null;

before(function (done) {
	var newUser = new User(testconfig.USER_TESTUSER);
	newUser.save();
	currentUser = newUser;
	var newGame = new Game({title: 'testTitle', shortDescription: 'this is a short description', owner: newUser._id});
	currentGame = newGame;
	newGame.save(done);
});

after(function (done) {
	clearDB(done);
});

it('saves a review', function (done) {
	currentReview = new Review({owner: currentUser._id, game: currentGame._id, reviewText: 'this is a review text', rating: 3});
	currentReview.save(done);
});

it('finds a review by id', function (done) {
	Review.findById(currentReview._id, function (err, rating) {
		if (err) return done(err);
		rating.should.not.be.empty;
		done();
	});
});

it('removes a review by id', function (done) {
	Review.remove({_id: currentReview._id}, function (err) {
		if (err) throw err;
		done();
	});
});

it('does not find a comment with non-existant id', function (done) {
	Review.findById(currentReview._id, function (err, comment) {
		if (err) return done(err);
		assert.isNull(comment);
		done();
	});
});
