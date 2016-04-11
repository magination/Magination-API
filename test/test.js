var mocha = require('mocha');
var assert = require('assert');
var request = require('request');
var mongoose = require('mongoose');
var dbConfig = require('../server/config/db.config');
var testConfig = require('./test.config');
var User = require('../server/models/user/user.model');

function importTest (name, path) {
	describe(name, function () {
		require(path);
	});
}

describe('Starting tests', function () {
	before(function (done) {
		if (mongoose.connection.readyState === 0) {
			mongoose.connect(dbConfig.DATABASE.test, function (err) {
				if (err) throw err;
				mongoose.connection.db.dropDatabase(function (err) {
					if (err) throw err;
					done();
				});
			});
		}
		else {
			mongoose.connection.db.dropDatabase(function (err) {
				if (err) throw err;
				done();
			});
		}
	});

	importTest('Testing user.model', './models/user/user.model.test');
	importTest('Testing game.model', './models/game/game.model.test');
	importTest('Testing user.route', './routes/user/user.route.test');
	importTest('Testing game.route', './routes/game/game.route.test');
	importTest('Testing login.route', './routes/login/login.route.test');

	after(function (done) {
		mongoose.connection.db.dropDatabase(function (err) {
			if (err) throw err;
			var testUser = new User(testConfig.USER_TESTUSER);
			testUser.save(function (err) {
				if (err) throw err;
				mongoose.connection.close(function (err) {
					if (err) throw err;
					done();
				});
			});
		});
	});
});
