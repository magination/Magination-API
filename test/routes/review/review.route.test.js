var mongoose = require('mongoose');
var request = require('supertest');
var User = require('../../../server/models/user/user.model');
var Game = require('../../../server/models/game/game.model');
var Review = require('../../../server/models/review/review.model');
var serverconfig = require('../../../server/config/server.config');
var testconfig = require('../../test.config');
var url = serverconfig.ADDRESS + serverconfig.PORT;
var assert = require('chai').assert;
var dbConfig = require('../../../server/config/db.config');
var clearDB = require('mocha-mongoose')(dbConfig.DATABASE.test, {noClear: true});

var currentUser = null;
var currentGame = null;
var currentReview = null;
var token = null;

before(function (done) {
	currentUser = new User(testconfig.USER_TESTUSER);
	currentUser.save();
	currentGame = new Game({title: 'test game',
							shortDescription: 'this is a short description',
							pieces: {
								singles: 4,
								doubles: 5,
								triples: 6
							},
							isPlayableWithMorePlayers: true,
							isPlayableWithTeams: true,
							numberOfPlayers: 3,
							otherObjects: ['cup', 'book'],
							rules: ['rule 1', 'rule 2'],
							alternativeRules: ['alt rule 1', 'alt rule 2'],
							owner: currentUser._id});
	currentGame.save(function (err) {
		if (err) return done(err);
		currentReview = new Review({owner: currentUser._id, game: currentGame._id, rating: 3, reviewText: 'This is a review text'});
		currentReview.save(function (err) {
			if (err) return done(err);
			Review.pushToGameAndAddRating(currentGame._id, currentReview);
			done();
		});
	});
});

before(function (done) {
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

after(function (done) {
	clearDB(done);
});

it('GET /games/:gameId/reviews - should return 200 and list of reviews in game', function (done) {
	request(url)
	.get('/api/games/' + currentGame._id + '/reviews')
	.set('Accept', 'application/json')
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		assert.lengthOf(res.body.reviews, 1);
		done();
	});
});

it('GET /games/:gameId/reviews/:reviewId - should return 200 and a review', function (done) {
	request(url)
	.get('/api/games/' + currentGame._id + '/reviews/' + currentReview._id)
	.set('Accept', 'application/json')
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		done();
	});
});

it('GET /games/:gameId/reviews/:reviewId - should return 404 if the supplied id does not exist', function (done) {
	request(url)
	.get('/api/games/' + currentGame._id + '/reviews/' + currentGame._id)
	.set('Accept', 'application/json')
	.expect(404)
	.end(function (err, res) {
		if (err) return done(err);
		done();
	});
});

it('GET /games/:gameId/reviews?userId=someid- should return 200 and a review if the user has a review on the specified game', function (done) {
	request(url)
	.get('/api/games/' + currentGame._id + '/reviews?userId=' + currentUser._id)
	.set('Accept', 'application/json')
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		done();
	});
});

it('PUT /games/:gameId/reviews/:reviewId - should return 200, and update the reviewText field', function (done) {
	request(url)
	.put('/api/games/' + currentGame._id + '/reviews/' + currentReview._id)
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.expect(200)
	.send({reviewText: 'new comment text'})
	.end(function (err, res) {
		if (err) return done(err);
		request(url)
		.get('/api/games/' + currentGame._id + '/reviews/' + currentReview._id)
		.set('Accept', 'application/json')
		.expect(200)
		.end(function (err, res) {
			if (err) return done(err);
			assert.equal('new comment text', res.body.reviewText);
			done();
		});
	});
});

it('PUT /games/:gameId/reviews/:reviewId - should return 200, and update the rating field. This should also update the rating in game.', function (done) {
	request(url)
	.put('/api/games/' + currentGame._id + '/reviews/' + currentReview._id)
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.expect(200)
	.send({rating: 5})
	.end(function (err, res) {
		if (err) return done(err);
		request(url)
		.get('/api/games/' + currentGame._id + '/reviews/' + currentReview._id)
		.set('Accept', 'application/json')
		.expect(200)
		.end(function (err, res) {
			if (err) return done(err);
			assert.equal(5, res.body.rating);
			Game.findOne({_id: currentGame._id}, function (err, game) {
				if (err || !game) return done('Err or no game found.');
				assert.equal(game.sumOfVotes, 5);
				assert.equal(game.numberOfVotes, 1);
				done();
			});
		});
	});
});

it('DELETE /games/:gameId/reviews/:reviewId - should return 204. This should also update the rating in game.', function (done) {
	request(url)
	.delete('/api/games/' + currentGame._id + '/reviews/' + currentReview._id)
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.expect(204)
	.end(function (err, res) {
		if (err) return done(err);
		request(url)
		.get('/api/games/' + currentGame._id)
		.set('Accept', 'application/json')
		.expect(200)
		.end(function (err, res) {
			if (err) return done(err);
			assert.equal(res.body.numberOfVotes, 0);
			assert.equal(res.body.sumOfVotes, 0);
			assert.equal(res.body.rating, 0);
			done();
		});
	});
});
