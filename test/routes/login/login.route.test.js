var mongoose = require('mongoose');
var request = require('supertest');
var User = require('../../../server/models/user/user.model');
var serverconfig = require('../../../server/config/server.config');
var testconfig = require('../../test.config');
var url = serverconfig.ADDRESS + serverconfig.PORT;
var dbConfig = require('../../../server/config/db.config');
var clearDB = require('mocha-mongoose')(dbConfig.DATABASE.test, {noClear: true});

var refreshToken = null;
var token = null;

before(function (done) {
	var newUser = new User(testconfig.USER_TESTUSER);
	newUser.save(done);
});

after(function (done) {
	clearDB(done);
});

it('POST /api/login - should return 400 when json-object is faulty', function (done) {
	request(url)
	.post('/api/login')
	.set('Accept', 'application/json')
	.expect(400)
	.end(function (err, res) {
		if (err) return done(err);
		done();
	});
});

it('POST /api/login - should return 401 when json-object contains invalid credentials', function (done) {
	request(url)
	.post('/api/login')
	.set('Accept', 'application/json')
	.send(testconfig.USER_INVALID)
	.expect(401)
	.end(function (err, res) {
		if (err) return done(err);
		done();
	});
});

it('POST /api/login - should return 200 when json-object contains valid credentials', function (done) {
	request(url)
	.post('/api/login')
	.set('Accept', 'application/json')
	.send(testconfig.USER_TESTUSER)
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		token = res.body.token;
		refreshToken = res.body.refreshToken;
		done();
	});
});

it('GET /api/login/refresh - should return 200 and a refreshed token if the supplied refresh token is valid', function (done) {
	request(url)
	.get('/api/login/refresh')
	.set('Accept', 'application/json')
	.set('Authorization', refreshToken)
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		done();
	});
});

it('GET /api/login/refresh - should return 401 if the supplied token is an access token', function (done) {
	request(url)
	.get('/api/login/refresh')
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.expect(401)
	.end(function (err, res) {
		if (err) return done(err);
		done();
	});
});

it('GET /api/login/refresh - should return 401 if the supplied token is invalid', function (done) {
	var token = 'thisisaninvalidtoken';
	request(url)
		.get('/api/login/refresh')
		.set('Accept', 'application/json')
		.set('Authorization', token)
		.expect(401)
		.end(function (err, res) {
			if (err) return done(err);
			done();
		});
});
