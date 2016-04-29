var mongoose = require('mongoose');
var request = require('supertest');
var User = require('../../../server/models/user/user.model');
var Game = require('../../../server/models/game/game.model');
var Review = require('../../../server/models/review/review.model');
var serverconfig = require('../../../server/config/server.config');
var testconfig = require('../../test.config');
var url = serverconfig.ADRESS + serverconfig.PORT;
var assert = require('chai').assert;
var dbConfig = require('../../../server/config/db.config');
var clearDB = require('mocha-mongoose')(dbConfig.DATABASE.test, {noClear: true});

var currentUser = null;
var currentUnpublishedGame = null;
var token = null;

before(function (done) {
	currentUser = new User(testconfig.USER_TESTUSER);
	currentUser.save(function (err) {
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

after(function (done) {
	clearDB(done);
});

it('POST /api/unpublishedGames - should return 201 and create a new unpublishedGame', function (done) {
	request(url)
	.post('/api/unpublishedGames/')
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.send({
		title: 'title',
		shortDescription: 'short'
	})
	.expect(201)
	.end(function (err, res) {
		if (err) return done(err);
		currentUnpublishedGame = res.body;
		done();
	});
});

it('GET /api/users/:userId/unpublishedGames - should return 200 and a list of unpublishedGames', function (done) {
	request(url)
	.get('/api/users/' + currentUser._id + '/unpublishedGames')
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		assert.lengthOf(res.body, 1);
		done();
	});
});

it('PUT /api/unpublishedGame/:id - should return 200 and update the unpublishedGame', function (done) {
	request(url)
	.put('/api/unpublishedGames/' + currentUnpublishedGame._id)
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.send({title: 'new title'})
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		assert.equal(res.body.title, 'new title');
		done();
	});
});

it('POST /api/unpublishedGames/:id/publish - should return 200 and publish the unpublished game, and remove the unpublishedGame.. ', function (done) {
	request(url)
	.post('/api/unpublishedGames/' + currentUnpublishedGame._id + '/publish')
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		request(url)
		.get('/api/users/' + currentUser._id + '/unpublishedGames')
		.set('Accept', 'application/json')
		.set('Authorization', token)
		.expect(200)
		.end(function (err, res) {
			if (err) return done(err);
			assert.lengthOf(res.body, 0);
			done();
		});
	});
});

it('DELETE /api/unpublishedGame/:id - should return 204 and delete the unpublishedGame', function (done) {
	// Creates a  new game. The publish method above publishes game and deletes the unpublished game.
	request(url)
	.post('/api/unpublishedGames/')
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.send({
		title: 'title',
		shortDescription: 'short'
	})
	.expect(201)
	.end(function (err, res) {
		if (err) return done(err);
		currentUnpublishedGame = res.body;
		request(url)
		.delete('/api/unpublishedGames/' + currentUnpublishedGame._id)
		.set('Accept', 'application/json')
		.set('Authorization', token)
		.expect(204)
		.end(function (err, res) {
			if (err) return done(err);
			done();
		});
	});
});

