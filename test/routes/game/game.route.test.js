var request = require('supertest');
var serverconfig = require('../../../server/config/server.config');
var testconfig = require('../../test.config');
var User = require('../../../server/models/user/user.model');
var Game = require('../../../server/models/game/game.model');
var mongoose = require('mongoose');
var assert = require('chai').assert;
var should = require('chai').should();
var url = serverconfig.ADDRESS + serverconfig.PORT;
var dbConfig = require('../../../server/config/db.config');
var clearDB = require('mocha-mongoose')(dbConfig.DATABASE.test, {noClear: true});

var currentUser = null;
var currentGame = null;
var token = null;

before(function (done) {
	var newUser = new User(testconfig.USER_TESTUSER);
	currentUser = newUser;
	newUser.save(function (err) {
		if (err) return done(err);
		var newGame = new Game({title: 'test', shortDescription: 'this is a description', owner: currentUser._id});
		newGame.save(function (err) {
			if (err) return done(err);
			currentGame = newGame;
			request(url)
			.post('/api/login')
			.set('Accept', 'application/json')
			.send(testconfig.USER_TESTUSER_LOGINDATA)
			.expect(200)
			.end(function (err, res) {
				if (err) return done(err);
				token = res.body.token;
				done();
			});
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
		assert.lengthOf(res.body.games, 1);
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
		assert.lengthOf(res.body.games, 1);
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
		assert.lengthOf(res.body.games, 1);
		done();
	});
});

it('GET /api/games?owner=doesnotexist - should return 0 games with owner that does not exists', function (done) {
	request(url)
	.get('/api/games?owner=doesnotexist')
	.set('Accept', 'application/json')
	.expect(404)
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
	.expect(404)
	.end(function (err, res) {
		if (err) return done(err);
		res.body.should.be.empty;
		done();
	});
});

it('GET /api/games/:game_id - should return a game when the given id is valid', function (done) {
	request(url)
	.get('/api/games/' + currentGame._id)
	.set('Accept', 'application/json')
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		res.body.should.not.be.empty;
		done();
	});
});

it('POST /api/games/:game_id/fork - should fork the game and return a new unbpulishedGame', function (done) {
	request(url)
	.post('/api/games/' + currentGame._id + '/fork')
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		res.body.title.should.equal(currentGame.title);
		res.body._id.should.not.equal(currentGame._id);
		done();
	});
});

it('POST /api/games/:game_id/fork - should return 404 if the supplied game_id does not exist', function (done) {
	request(url)
	.post('/api/games/' + currentUser._id + '/fork')
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.expect(404)
	.end(function (err, res) {
		if (err) return done(err);
		done();
	});
});

it('POST /games/:game_id/unpublish - should unpublish the game and return 200 with a new unbpulishedGame object', function (done) {
	request(url)
	.post('/api/games/' + currentGame._id + '/unpublish')
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		res.body.title.should.equal(currentGame.title);
		res.body._id.should.not.equal(currentGame._id);
		request(url)
		.get('/api/games/' + currentGame._id)
		.set('Accept', 'application/json')
		.expect(404)
		.end(function (err, res) {
			if (err) return done(err);
			done();
		});
	});
});

it('POST /games/:game_id/unpublish - should return 404 if the game no longer exist', function (done) {
	request(url)
	.post('/api/games/' + currentGame._id + '/unpublish')
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.expect(404)
	.end(function (err, res) {
		if (err) return done(err);
		done();
	});
});
