var request = require('supertest');
var serverconfig = require('../../../server/config/server.config');
var testconfig = require('../../test.config');
var User = require('../../../server/models/user/user.model');
var Game = require('../../../server/models/game/game.model');
var mongoose = require('mongoose');
var assert = require('chai').assert;
var should = require('chai').should();
var url = serverconfig.ADRESS + serverconfig.PORT;
var dbConfig = require('../../../server/config/db.config');
var clearDB = require('mocha-mongoose')(dbConfig.DATABASE.test, {noClear: true});

var currentUser = null;

before(function (done) {
	var newUser = new User(testconfig.USER_TESTUSER);
	currentUser = newUser;
	newUser.save(function (err) {
		if (err) return done(err);
		var newGame = new Game({title: 'test', shortDescription: 'this is a description', owner: currentUser._id});
		newGame.save(function (err) {
			if (err) return done(err);
			done();
		});
	});
});

after(function (done) {
	clearDB(done);
});

it('GET /api/games - should return availiable games', function (done) {
	request(url)
	.get('/api/games')
	.set('Accept', 'application/json')
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		assert.lengthOf(res.body, 1);
		done();
	});
});

it('GET /api/games?title=test - should return game with title "test"', function (done) {
	request(url)
	.get('/api/games?title=test')
	.set('Accept', 'application/json')
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		assert.lengthOf(res.body, 1);
		done();
	});
});

it('GET /api/games?owner=admin - should return game with owner "admin"', function (done) {
	request(url)
	.get('/api/games?owner=admin')
	.set('Accept', 'application/json')
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		assert.lengthOf(res.body, 1);
		done();
	});
});

it('GET /api/games?owner=doesnotexist - should return 0 games with owner that does not exists', function (done) {
	request(url)
	.get('/api/games?owner=doesnotexist')
	.set('Accept', 'application/json')
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		res.body.should.be.empty;
		done();
	});
});

it('GET /api/games?title=doesnotexist - should return 0 games with title that does not exists', function (done) {
	request(url)
	.get('/api/games?owner=doesnotexist')
	.set('Accept', 'application/json')
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		res.body.should.be.empty;
		done();
	});
});
