var mocha = require('mocha');
var assert = require('assert');
var request = require('request');
var mongoose = require('mongoose');
var dbConfig = require('../server/config/db.config');
var testConfig = require('./test.config');
var User = require('../server/models/user/user.model');

function importTest(name, path) {
	describe(name, function () {
		require(path);
	});
}

describe('Starting tests', function () {
	before(function (done) {
		if (mongoose.connection.readyState === 0) {
			mongoose.connect(dbConfig.DATABASE.test);
		}
		mongoose.connection.db.dropDatabase();
		done();
	});

	importTest('Testing user.model', './models/user/user.model.test');
	importTest('Testing game.model', './models/game/game.model.test');
	importTest('Testing user.route', './routes/user/user.route.test');
	importTest('Testing game.route', './routes/game/game.route.test');
	importTest('Testing login.route', './routes/login/login.route.test');

	after(function (done) {
		mongoose.connection.db.dropDatabase();
		mongoose.disconnect();
		done();
	});
});
