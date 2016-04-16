var mongoose = require('mongoose');
var testConfig = require('./test.config');
var User = require('../server/models/user/user.model');
var Game = require('../server/models/game/game.model');
var dbConfig = require('../server/config/db.config');
var clearDB = require('mocha-mongoose')(dbConfig.DATABASE.test, {noClear: true});
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Done to accept self signed HTTPS certfificate

function importTest (name, path) {
	describe(name, function () {
		require(path);
	});
}

describe('Starting tests', function () {
	before(function (done) {
		if (mongoose.connection.db) return done();
		mongoose.connect(dbConfig.DATABASE.test, function (err) {
			if (err) return done(err);
			clearDB(done);
		});
	});

	importTest('Testing user.model', './models/user/user.model.test');
	importTest('Testing game.model', './models/game/game.model.test');
	importTest('Testing comment.model', './models/comment/comment.model.test');
	importTest('Testing rating.model', './models/rating/rating.model.test');
	importTest('Testing user.route', './routes/user/user.route.test');
	importTest('Testing game.route', './routes/game/game.route.test');
	importTest('Testing login.route', './routes/login/login.route.test');

	after(function (done) {
		mongoose.connection.db.dropDatabase(function (err) {
			if (err) return done(err);
			var testUser = new User(testConfig.USER_TESTUSER);
			testUser.save(function (err) {
				if (err) return done(err);
				var testUser2 = new User(testConfig.USER_TESTUSER2);
				testUser2.save(function (err) {
					if (err) return done(err);
					Game.ensureIndexes(function (err) {
						if (err) return done(err);
						mongoose.connection.close(function (err) {
							if (err) return done(err);
							return done();
						});
					});
				});
			});
		});
	});
});
