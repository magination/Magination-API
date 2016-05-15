var express = require('express');
var router = express.Router();
var Game = require('../../models/game/game.model');
var UnpublishedGame = require('../../models/unpublishedGame/unpublishedGame.model');
var GameList = require('../../models/gameList/gameList.model');
var User = require('../../models/user/user.model');
var verifyToken = require('../login/verifyToken');
var constants = require('../../config/constants.config');
var Report = require('../../models/report/report.model');
var GameCreator = require('../../models/gameCreator/gameCreator.model');
var validator = require('../../validator/validator');
var check = require('check-types');
var _ = require('lodash');
var winston = require('winston');
var logger = require('../../logger/logger');
var bruteforce = require('../../bruteforce/bruteForce');

router.use(function (req, res, next) {
	next();
});

module.exports = function (app) {
	router.route('/games').get(populateOwnerField, parseSearchQuery, function (req, res) {
		Game.find(req.query, '-__v', req.options, function (err, games) {
			if (err) {
				logger.log('error', 'GET /games', err);
				return res.status(500).send();
			}
			return res.status(200).json({games: games});
		}).populate('owner', 'username');
	});

	router.route('/games/top').get(function (req, res) {
		Game.find({}, '-__v', {sort: '-rating', limit: 16}, function (err, games) {
			if (err) {
				logger.log('error', 'GET /games/new', err);
				return res.status(500).send();
			}
			else return res.status(200).json(games);
		}).populate('owner', 'username');
	});

	router.route('/games/featured')
	.get(function (req, res) {
		GameList.find({title: 'featuredGames'}, function (err, list) {
			if (err) {
				logger.log('error', 'GET /games/featured', err);
				return res.status(500).send(err);
			}
			if (!list[0]) return res.status(200).json([]);
			else return res.status(200).json(list[0].games);
		}).select('games -_id').populate({
			path: 'games',
			populate: {
				path: 'owner',
				select: 'username'
			}
		});
	})
	.put(verifyToken, verifyPrivileges, function (req, res) {
		if (!req.body.gameId || !validator.isValidId(req.body.gameId)) return res.status(422).send();
		GameList.findOne({title: 'featuredGames'}, function (err, list) {
			if (err) {
				logger.log('error', 'PUT /games/featured', err);
				return res.status(500).send();
			}
			else if (!list) {
				var gameList = new GameList({title: 'featuredGames'});
				gameList.games.push(req.body.gameId);
				gameList.save(function (err) {
					if (err) return res.status(500).send();
					else return res.status(200).json(gameList);
				});
			}
			else {
				if (list.games.indexOf(req.body.gameId) < 0) {
					list.games.push(req.body.gameId);
				}
				list.save(function (err) {
					if (err) return res.status(500).send();
					else return res.status(200).json(list);
				});
			}
		});
	});

	router.route('/games/new').get(function (req, res) {
		Game.find({}, '-__v', {sort: '-date', limit: 8}, function (err, games) {
			if (err) {
				logger.log('error', 'GET /games/new', err);
				return res.status(500).send();
			}
			else return res.status(200).json(games);
		}).populate('owner', 'username');
	});

	router.route('/games/:game_id')
		.get(function (req, res) {
			if (!validator.isValidId(req.params.game_id)) return res.status(422).send();
			Game.findById(req.params.game_id, function (err, game) {
				if (err) {
					logger.log('error', 'GET /games/:game_id', err);
					return res.status(500).send();
				}
				if (!game) return res.status(404).send();
				else return res.status(200).json(game);
			}).populate('owner', 'username');
		});

	router.route('/games/:game_id/fork').post(verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.game_id)) return res.status(422).send();
		Game.findById({_id: req.params.game_id}, function (err, game) {
			if (err) {
				logger.log('error', 'POST /games/:game_id/fork', err);
				return res.status(500).send();
			}
			if (!game) return res.status(404).send();
			var forkedGame = game.toObject();
			delete forkedGame._id;
			delete forkedGame.__v;
			forkedGame.parentGame = game._id;
			forkedGame.owner = req.verified.id;
			forkedGame.numberOfVotes = 0;
			forkedGame.sumOfVotes = 0;
			forkedGame.rating = 0;
			forkedGame.reviews = undefined;
			if (forkedGame.gameCreators) {
				var data = [];
				GameCreator.find({_id: {$in: forkedGame.gameCreators}}, function (err, gameCreators) {
					if (err) {
						logger.log('error', 'POST /games/:game_id/fork', err);
						return res.status(500).send();
					}
					gameCreators.forEach(function (gameCreator) {
						var oldGameCreator = _.omit(gameCreator.toObject(), ['_id', '__v']);
						oldGameCreator.owner = req.verified.id;
						var copiedGameCreator = new GameCreator(oldGameCreator);
						copiedGameCreator.save();
						data.push(copiedGameCreator._id);
					});
					forkedGame.gameCreators = data;
					var unpubGame = new UnpublishedGame(forkedGame);
					unpubGame.save(function (err) {
						if (err) {
							logger.log('error', 'POST /games/:game_id/fork');
							return res.status(500).send();
						}
						return res.status(200).json(unpubGame);
					});
				});
			}
			else {
				var unpubGame = new UnpublishedGame(forkedGame);
				unpubGame.save(function (err) {
					if (err) {
						logger.log('error', 'POST /games/:game_id/fork', err);
						return res.status(500).send();
					}
					return res.status(200).json(unpubGame);
				});
			}
		});
	});

	router.route('/games/:game_id/unpublish').post(verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.game_id)) return res.status(422).send();
		Game.findById({_id: req.params.game_id}, function (err, game) {
			if (err) {
				logger.log('error', 'POST /games/:game_id/unpublish', err);
				return res.status(500).send();
			}
			if (!game) return res.status(404).send();
			if (!game.owner.equals(req.verified.id)) return res.status(401).send();
			var unpubGame = new UnpublishedGame(_.omit(game.toObject(), ['_id', '__v']));
			var oldGame = game;
			unpubGame.save(function (err) {
				if (err) {
					logger.log('error', 'POST /games/:game_id/unpublish', err);
					return res.status(500).send();
				}
				Game.remove({_id: game._id}, function (err, game) {
					if (err) {
						logger.log('error', 'POST /games/:game_id/unpublish', err);
						return res.status(500).send();
					}
					if (!game) return res.status(404).send();
					else {
						moveReportsFromPublishedToUnpublishedGame(oldGame, unpubGame);
						return res.status(200).json(unpubGame);
					}
				});
			});
		});
	});

	return router;
};

var verifyPrivileges = function (req, res, next) {
	if (req.verified.privileges >= User.privileges.MODERATOR) next();
	else return res.status(401).send();
};

var parseSearchQuery = function (req, res, next) {
	var query = {};
	var options = {};
	if (req.query.title) query.title = {'$regex': req.query.title, '$options': 'i'};
	if (req.query.exactTitle) query.title = {$regex: new RegExp(req.query.exactTitle, 'i')};
	if (req.query.singles) query['pieces.singles'] = {'$lte': req.query.singles};
	if (req.query.doubles) query['pieces.doubles'] = {'$lte': req.query.doubles};
	if (req.query.triples) query['pieces.triples'] = {'$lte': req.query.triples};
	if (req.query.numberOfPlayers) {
		query.$or = [{'numberOfPlayers': req.query.numberOfPlayers}, {'isPlayableWithMorePlayers': true, numberOfPlayers: {$lte: req.query.numberOfPlayers}}];
	};
	if (req.query.otherObjects === 'true') query.otherObjects = {$gt: []};
	else if (req.query.otherObjects === 'false') query.otherObjects = {$lte: []};
	if (req.query.teams === 'true') query.isPlayableInTeams = true;
	else if (req.query.teams === 'false') query.isPlayableInTeams = false;
	if (req.query.owner) query.owner = req.query.owner;
	if (req.query.rating) query.rating = {'$gte': req.query.rating};
	if (req.query.search) query['$text'] = {$search: req.query.search};
	if (req.query.start) options.skip = parseInt(req.query.start);
	if (req.query.quantity) options.limit = parseInt(req.query.quantity);
	if (req.query.sortBy) options['sort'] = {rating: -1};
	req.query = query;
	req.options = options;
	next();
};

var populateOwnerField = function (req, res, next) {
	if (!req.query) {
		req.query = {};
		next();
	}
	if (req.query.owner) {
		User.findOne({username: req.query.owner}, '-password -__v', function (err, user) {
			if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			if (user == null) return res.status(404).json({});
			else req.query.owner = user._id;
			next();
		});
	}
	else next();
};

var moveReportsFromPublishedToUnpublishedGame = function (oldGame, newGame) {
	/*
	method to update reports when a game is published/unpublished.
	 */
	Report.find({id: oldGame._id, type: Report.types.GAME}, function (err, reports) {
		if (err) return winston.log('error', err);
		reports.forEach(function (report) {
			report.id = newGame._id;
			report.type = Report.types.UNPUBLISHED_GAME;
			report.save(function (err) {
				if (err) winston.log('error', err);
			});
		});
	});
};
