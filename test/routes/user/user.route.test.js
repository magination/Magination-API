var mongoose = require('mongoose');
var assert = require('assert');
var expect = require('chai').expect;
var request = require('supertest');
var serverconfig = require('../../../server/config/server.config');
var testconfig = require('../../test.config');
var url = serverconfig.ADRESS + serverconfig.PORT;
var User = require('../../../server/models/user/user.model');

after(function (done) {
	mongoose.connection.db.dropDatabase();
	done();
});

it('POST /api/users - should create a user', function (done) {
	/*
	This user will not affect the other tests due to the email-verification.
	This user is stored in the magination_tempuser until email is confirmed, which
	is not done in this test. The tempusers are dropped after tests are run.
	 */
	request(url)
	.post('/api/users')
	.send(testconfig.USER_VALID)
	.set('Accept', 'application/json')
	.expect(200)
	.end(function (err, res) {
		if (err) throw err;
		done();
	});
});

it('POST /api/users - should return 400: bad request with faulty json-object', function (done) {
	request(url)
	.post('/api/users')
	.send(testconfig.USER_INVALID)
	.set('Accept', 'application/json')
	.expect(400)
	.end(function (err, res) {
		if (err) throw err;
		done();
	});
});

it('GET /api/users/:id - should return 403: forbidden on request with no token', function (done) {
	request(url)
	.get('/api/users/:id')
	.set('Accept', 'application/json')
	.expect(400)
	.end(function (err, res) {
		if (err) throw err;
		done();
	});
});
