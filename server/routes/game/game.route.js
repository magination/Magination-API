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
var winston = require('winston');
var _ = require('lodash');
var bruteforce = require('../../bruteforce/bruteForce');

router.use(function (req, res, next) {
	next();
});

module.exports = function (app) {
	var validateGameQuery = function (req, res, next) {
		if (!req.body.title || !req.body.shortDescription) return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		if (req.body._id) return res.status(422).json({message: 'a game can not be created with a given id.'});
		else next();
	};

	router.post('/games', verifyToken, validateGameQuery, function (req, res) {
		var newgame = new Game(_.extend(req.body, {owner: req.verified.id}));
		if (!req.body.parentGame) newgame.parentGame = undefined;
		Game.findOne({title: req.body.title}, function (err, game) {
			if (err) return res.status(500).send();
			if (game) return res.status(409).send();
			newgame.save(function (err) {
				if (err) return res.status(500).send();
				newgame.populate('owner', 'username', function (err) {
					if (err) res.status(500).send();
					else return res.status(201).json(newgame);
				});
			});
		});
	});

	var parseSearchQuery = function (req, res, next) {
		var query = {};
		var options = {};
		if (req.query.title) query.title = {'$regex': req.query.title, '$options': 'i'};
		if (req.query.exactTitle) query.title = req.query.exactTitle;
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

	router.route('/games').get(populateOwnerField, parseSearchQuery, function (req, res) {
		Game.find(req.query, '-__v', req.options, function (err, games) {
			if (err) {
				res.status(500).json({mesage: constants.httpResponseMessages.internalServerError});
				console.log(err);
			}
			else res.status(200).json({games: games});
		}).populate('owner', 'username');
	});

	router.route('/games/:game_id')
		.get(function (req, res) {
			Game.findById(req.params.game_id, function (err, game) {
				if (err) return res.send(constants.httpResponseMessages.internalServerError);
				if (game == null) return res.status(404).json({message: constants.httpResponseMessages.notFound});
				else return res.json(game);
			}).populate('owner', 'username');
		})
		.put(verifyToken, function (req, res) {
			Game.findById({_id: req.params.game_id}, function (err, game) { // TODO: Validate id before doing db call
				if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				if (!game) return res.status(404).json({message: constants.httpResponseMessages.badRequest});
				if (!game.owner.equals(req.verified.id)) return res.status(401).json({message: constants.httpResponseMessages.unauthorized});
				if (req.body.title) game.title = req.body.title;
				if (req.body.mainDescription) game.mainDescription = req.body.mainDescription;
				game.save(function (err, game) {
					if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
					game.populate('owner', 'username', function (err) {
						if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
						return res.status(200).json(game);
					});
				});
			});
		})
		.delete(verifyToken, function (req, res) {
			Game.findById({_id: req.params.game_id}, function (err, game) {
				if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				if (!game) return res.status(404).json({message: constants.httpResponseMessages.notFound});
				if (!game.owner.equals(req.verified.id)) return res.status(401).json({message: constants.httpResponseMessages.unauthorized});
				Game.remove({_id: req.params.game_id}, function (err, game) {
					if (!game) return res.status(404).json({message: constants.httpResponseMessages.notFound});
					if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
					else res.status(204).json({message: constants.httpResponseMessages.deleted});
				});
			});
		});

	router.route('/games/:game_id/fork').post(verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.game_id)) return res.status(422).send();
		Game.findById({_id: req.params.game_id}, function (err, game) {
			if (err) return res.status(500).send();
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
					if (err) return res.status(500).send();
					gameCreators.forEach(function (gameCreator) {
						var oldGameCreator = _.omit(gameCreator.toObject(), ['_id', '__v']);
						oldGameCreator.owner = req.verified.id;
						var copiedGameCreator = new GameCreator(oldGameCreator);
						copiedGameCreator.save();
						data.push(copiedGameCreator._id);
					});
					console.log(forkedGame.gameCreators);
					forkedGame.gameCreators = data;
					console.log(data);
					var unpubGame = new UnpublishedGame(forkedGame);
					unpubGame.save(function (err) {
						if (err) return res.status(500).send();
						return res.status(200).json(unpubGame);
					});
				});
			}
			else {
				var unpubGame = new UnpublishedGame(forkedGame);
				unpubGame.save(function (err) {
					if (err) return res.status(500).send();
					return res.status(200).json(unpubGame);
				});
			}
		});
	});

	router.route('/games/:game_id/unpublish').post(verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.game_id)) return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		Game.findById({_id: req.params.game_id}, function (err, game) {
			if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			if (!game) return res.status(404).json({message: constants.httpResponseMessages.notFound});
			if (!game.owner.equals(req.verified.id)) return res.status(401).json({message: constants.httpResponseMessages.unauthorized});
			var unpubGame = new UnpublishedGame(_.omit(game.toObject(), ['_id', '__v']));
			var oldGame = game;
			unpubGame.save(function (err) {
				if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				Game.remove({_id: game._id}, function (err, game) {
					if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
					if (!game) return res.status(404).json({message: constants.httpResponseMessages.notFound});
					else {
						moveReportsFromPublishedToUnpublishedGame(oldGame, unpubGame);
						res.status(200).json(unpubGame);
					}
				});
			});
		});
	});

	return router;
};

var moveReportsFromPublishedToUnpublishedGame = function (oldGame, newGame) {
	/*
	method to update reports when a game is published/unpublished.
	 */
	Report.find({id: oldGame._id, type: Report.types.GAME}, function (err, reports) {
		if (err) winston.log('error', err);
		reports.forEach(function (report) {
			report.id = newGame._id;
			report.type = Report.types.UNPUBLISHED_GAME;
			report.save(function (err) {
				if (err) winston.log('error', err);
			});
		});
	});
};
