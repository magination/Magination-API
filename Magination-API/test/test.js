var mongoose = require('mongoose');
var testConfig = require('./test.config');
var User = require('../server/models/user/user.model');
var Game = require('../server/models/game/game.model');
var Review = require('../server/models/review/review.model');
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
	// MODELS
	importTest('Testing user.model', './models/user/user.model.test');
	importTest('Testing game.model', './models/game/game.model.test');
	importTest('Testing review.model', './models/review/review.model.test');
	importTest('Testing unpublishedGame.model', './models/unpublishedGame/unpublishedGame.model.test');
	importTest('Testing report.model', './models/report/report.model.test');
	importTest('Testing gameCreator.model', './models/gameCreator/gameCreator.model.test');
	// ROUTES
	importTest('Testing user.route', './routes/user/user.route.test');
	importTest('Testing game.route', './routes/game/game.route.test');
	importTest('Testing login.route', './routes/login/login.route.test');
	importTest('Testing review.route', './routes/review/review.route.test');
	importTest('Testing unpublishedGame.route', './routes/unpublishedGame/unpublishedGame.route.test');
	importTest('Testing report.route', './routes/report/report.route.test');
	importTest('Testing gameCreator.route', './routes/gameCreator/gameCreator.route.test');
	importTest('Testing image.route', './routes/image/image.route.test');

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
						var game = new Game(
							{title: 'test game',
							shortDescription: 'this is a short description',
							pieces: {
								singles: 4,
								doubles: 5,
								triples: 6
							},
							isPlayableWithMorePlayers: true,
							isPlayableInTeams: true,
							sumOfVotes: 4,
							numberOfVotes: 1,
							rating: 4,
							numberOfPlayers: 3,
							images: ['http://www.magination.no/images/game1_crop.jpg',
									'http://www.magination.no/images/game2_crop.jpg',
									'http://www.magination.no/images/game3_crop.jpg'],
							otherObjects: ['cup', 'book'],
							rules: ['rule 1', 'rule 2'],
							alternativeRules: ['alt rule 1', 'alt rule 2'],
							owner: testUser._id});
						var game2 = new Game(
							{title: 'test game 2',
							shortDescription: 'this is a short description 2',
							pieces: {
								singles: 4,
								doubles: 5,
								triples: 6
							},
							isPlayableWithMorePlayers: true,
							isPlayableInTeams: true,
							sumOfVotes: 3,
							numberOfVotes: 1,
							rating: 3,
							numberOfPlayers: 3,
							images: ['http://www.magination.no/images/game1_crop.jpg',
									'http://www.magination.no/images/game2_crop.jpg',
									'http://www.magination.no/images/game3_crop.jpg'],
							otherObjects: ['cup', 'book'],
							reviews: [],
							rules: ['rule 1', 'rule 2'],
							alternativeRules: ['alt rule 1', 'alt rule 2'],
							owner: testUser._id});
						for (var i = 0; i < 53; i++) {
							var review = new Review({game: game._id, owner: testUser._id, reviewText: i, rating: 3});
							review.save();
							game2.reviews.push(review._id);
						}
						game.save(function (err, user) {
							if (err) return done(err);
							game2.save(function (err, user) {
								if (err) return done(err);
								return done();
							});
						});
					});
				});
			});
		});
	});
});
