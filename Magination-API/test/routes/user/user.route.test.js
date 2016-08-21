var mongoose = require('mongoose');
var request = require('supertest');
var serverconfig = require('../../../server/config/server.config');
var testconfig = require('../../test.config');
var url = serverconfig.ADDRESS + serverconfig.PORT;
var dbConfig = require('../../../server/config/db.config');
var User = require('../../../server/models/user/user.model');
var clearDB = require('mocha-mongoose')(dbConfig.DATABASE.test, {noClear: true});

var token = null;
var currentUser = null;

before(function (done) {
	currentUser = new User(testconfig.USER_TESTUSER);
	currentUser.save(function (err) {
		if (err) return done(err);
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

after(function (done) {
	clearDB(done);
});

it('POST /api/users - should create a user', function (done) {
	request(url)
	.post('/api/users')
	.send(testconfig.USER_VALID)
	.set('Accept', 'application/json')
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		done();
	});
});

it('POST /api/users - should return 400: bad request on request with faulty json-object', function (done) {
	request(url)
	.post('/api/users')
	.send(testconfig.USER_INVALID)
	.set('Accept', 'application/json')
	.expect(400)
	.end(function (err, res) {
		if (err) return done(err);
		done();
	});
});

it('GET /api/users/:id - should return 401 on request with invalid token', function (done) {
	request(url)
	.get('/api/users/:id')
	.set('Accept', 'application/json')
	.expect(401)
	.set('Authorization', '123')
	.end(function (err, res) {
		if (err) return done(err);
		done();
	});
});

it('GET /api/users/:id - should return 401 on request with invalid token', function (done) {
	request(url)
	.get('/api/users/:id')
	.set('Accept', 'application/json')
	.expect(401)
	.set('Authorization', '123')
	.end(function (err, res) {
		if (err) return done(err);
		done();
	});
});

it('GET /api/users/:id - should return 200 on request with valid token', function (done) {
	request(url)
	.get('/api/users/' + currentUser._id)
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		done();
	});
});
