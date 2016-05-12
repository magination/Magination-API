var request = require('supertest');
var serverconfig = require('../../../server/config/server.config');
var testconfig = require('../../test.config');
var User = require('../../../server/models/user/user.model');
var Game = require('../../../server/models/game/game.model');
var UnpublishedGame = require('../../../server/models/unpublishedGame/unpublishedGame.model');
var mongoose = require('mongoose');
var assert = require('chai').assert;
var should = require('chai').should();
var url = serverconfig.ADDRESS + serverconfig.PORT;
var dbConfig = require('../../../server/config/db.config');
var clearDB = require('mocha-mongoose')(dbConfig.DATABASE.test, {noClear: true});

var currentUser = null;
var currentGameCreator = null;
var token = null;
var currentUnpublishedGame = null;

before(function (done) {
	currentUser = new User(testconfig.USER_TESTUSER);
	currentUser.save(function (err) {
		if (err) return done(err);
		currentUnpublishedGame = new UnpublishedGame({owner: currentUser._id});
		currentUnpublishedGame.save(function (err) {
			if (err) return done(err);
			request(url)
			.post('/api/login')
			.set('Accept', 'application/json')
			.send(testconfig.USER_TESTUSER)
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

it('POST /unpublishedGames/:gameId/gameCreators - should return 201 and create a gameCreator', function (done) {
	request(url)
	.post('/api/unpublishedGames/' + currentUnpublishedGame._id + '/gameCreators')
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.send({json: 'thisIsJson', owner: currentUser._id})
	.expect(201)
	.end(function (err, res) {
		if (err) return done(err);
		currentGameCreator = res.body;
		done();
	});
});

it('PUT /api/unpublishedGames/:gameId/gameCreators/:gameCreatorId - should return 200 and update the gameCreator', function (done) {
	request(url)
	.put('/api/unpublishedGames/' + currentUnpublishedGame._id + '/gameCreators/' + currentGameCreator._id)
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.send({json: 'thisIsNewJson'})
	.expect(200)
	.end(function (err, res) {
		done(err);
		assert.equal('thisIsNewJson', res.body.json);
	});
});

it('GET /api/unpublishedGame/:gameId/gameCreators - should return 200 and al ist of gameCreators beloning to the specified game', function (done) {
	request(url)
	.get('/api/unpublishedGames/' + currentUnpublishedGame._id + '/gameCreators/')
	.set('Authorization', token)
	.set('Accept', 'application/json')
	.expect(200)
	.end(function (err, res) {
		done(err);
		assert.lengthOf(res.body, 1);
	});
});

it('DELETE /api/unpublishedGames/:gameId/gameCreators/:gameCreatorId - should return 204, delete the gameCreator and pull the gameCreator from user.', function (done) {
	request(url)
	.delete('/api/unpublishedGames/' + currentUnpublishedGame._id + '/gameCreators/' + currentGameCreator._id)
	.set('Authorization', token)
	.set('Accept', 'application/json')
	.expect(204)
	.end(function (err, res) {
		if (err) return done(err);
		request(url)
		.get('/api/unpublishedGames/' + currentUnpublishedGame._id + '/gameCreators/')
		.set('Authorization', token)
		.set('Accept', 'application/json')
		.expect(200)
		.end(function (err, res) {
			done(err);
			assert.lengthOf(res.body, 0);
		});
	});
});
