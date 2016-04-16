var mongoose = require('mongoose');
var request = require('supertest');
var serverconfig = require('../../../server/config/server.config');
var testconfig = require('../../test.config');
var url = serverconfig.ADRESS + serverconfig.PORT;
var dbConfig = require('../../../server/config/db.config');
var clearDB = require('mocha-mongoose')(dbConfig.DATABASE.test, {noClear: true});

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
