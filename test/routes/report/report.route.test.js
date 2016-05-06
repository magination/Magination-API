var mongoose = require('mongoose');
var request = require('supertest');
var User = require('../../../server/models/user/user.model');
var Report = require('../../../server/models/report/report.model');
var serverconfig = require('../../../server/config/server.config');
var testconfig = require('../../test.config');
var url = serverconfig.ADDRESS + serverconfig.PORT;
var dbConfig = require('../../../server/config/db.config');
var assert = require('chai').assert;
var clearDB = require('mocha-mongoose')(dbConfig.DATABASE.test, {noClear: true});

var currentUser = null;
var token = null;
var currentReport = null;

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

it('POST /api/reports - should return 201 and create a report', function (done) {
	request(url)
	.post('/api/reports')
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.send({reportText: 'the user spams', id: currentUser._id, type: 'user'})
	.expect(201)
	.end(function (err, res) {
		currentReport = res.body;
		done(err);
	});
});

it('GET /api/reports - should return 200 and a list of reports if the user has moderator or administrator rights', function (done) {
	request(url)
	.get('/api/reports')
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.expect(200)
	.end(function (err, res) {
		assert.lengthOf(res.body, 1);
		done(err);
	});
});

it('GET /api/reports/users - should return 200 and a list of reports contaning type user', function (done) {
	request(url)
	.get('/api/reports/users')
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.expect(200)
	.end(function (err, res) {
		assert.lengthOf(res.body, 1);
		done(err);
	});
});

it('GET /api/reports/games - should return 200 and a list of reports contaning type game', function (done) {
	request(url)
	.get('/api/reports/games')
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.expect(200)
	.end(function (err, res) {
		assert.lengthOf(res.body, 0);
		done(err);
	});
});

it('GET /api/reports/reviews - should return 200 and a list of reports contaning type review', function (done) {
	request(url)
	.get('/api/reports/reviews')
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.expect(200)
	.end(function (err, res) {
		assert.lengthOf(res.body, 0);
		done(err);
	});
});

it('DELETE /api/reports/:id - should return 204 and delete the report', function (done) {
	request(url)
	.delete('/api/reports/' + currentReport._id)
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.expect(204)
	.end(function (err, res) {
		done(err);
	});
});
