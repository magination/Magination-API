var Comment = require('../../../server/models/comment/comment.model');
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
var currentComment = null;

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

it('saves a comment', function (done) {
	currentComment = new Comment({owner: currentUser._id, game: currentGame._id, commentText: 'this is a comment text'});
	currentComment.save(done);
});

it('finds a comment by id', function (done) {
	Comment.findById(currentComment._id, function (err, comment) {
		if (err) return done(err);
		comment.should.not.be.empty;
		done();
	});
});

it('removes a comment by id', function (done) {
	Comment.remove({_id: currentComment._id}, function (err) {
		if (err) throw err;
		done();
	});
});

it('does not find a comment with non-existant id', function (done) {
	Comment.findById(currentComment._id, function (err, comment) {
		if (err) return done(err);
		assert.isNull(comment);
		done();
	});
});
