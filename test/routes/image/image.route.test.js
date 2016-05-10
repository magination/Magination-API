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
// TODO: ADD TESTS
