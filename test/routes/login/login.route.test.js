var mongoose = require('mongoose');
var request = require('supertest');
var User = require('../../../server/models/user/user.model');
var serverconfig = require('../../../server/config/server.config');
var testconfig = require('../../test.config');
var url = serverconfig.ADRESS + serverconfig.PORT;
var dbConfig = require('../../../server/config/db.config');
var clearDB = require('mocha-mongoose')(dbConfig.DATABASE.test, {noClear: true});

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
	/*
		This part is a bit tricky due to the fact that we have email-verification. Solved by simululating
		a user has been successfully registered with the User.save() function. This is done in the before-method.
	 */
	request(url)
	.post('/api/login')
	.set('Accept', 'application/json')
	.send(testconfig.USER_TESTUSER)
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		done();
	});
});

it('GET /api/login/refresh - should return 200 and a refreshed token if the supplied token is valid', function (done) {
	request(url)
	.post('/api/login')
	.set('Accept', 'application/json')
	.send(testconfig.USER_TESTUSER)
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		var token = res.body.token;
		request(url)
		.get('/api/login/refresh')
		.set('Accept', 'application/json')
		.set('Authorization', token)
		.expect(200)
		.end(function (err, res) {
			if (err) return done(err);
			done();
		});
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
