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

it('GET /api/public/editor - should return 200 and a list of pieces', function (done) {
	request(url)
	.get('/api/public/editor')
	.set('Accept', 'application/json')
	.expect(200)
	.end(function (err, res) {
		if (err) return done(err);
		done();
	});
});

it('DELETE /users/:userId/images - should return 404 if image does not exist', function (done) {
	request(url)
	.delete('/api/users/' + currentUser._id + '/images')
	.set('Accept', 'application/json')
	.set('Authorization', token)
	.send({url: '/doesnotexist.png'})
	.expect(404)
	.end(function (err, res) {
		if (err) return done(err);
		done();
	});
});

