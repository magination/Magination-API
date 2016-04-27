var express = require('express');
var router = express.Router();
var Game = require('../../models/game/game.model');
var GameList = require('../../models/gameList/gameList.model');
var User = require('../../models/user/user.model');
var verifyToken = require('../login/verifyToken');
var Rating = require('../../models/rating/rating.model');
var constants = require('../../config/constants.config');
var check = require('check-types');
var _ = require('lodash');

router.use(function (req, res, next) {
	next();
});

module.exports = function (app) {
	var validateGameQuery = function (req, res, next) {
		if (!req.body.title || !req.body.shortDescription) return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		else next();
	};

	router.get('/topgames', function (req, res) {
		GameList.findOne({title: 'topGames'}, function (err, gameList) {
			if (err) {
				console.log(err);
				return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			}
			if (!gameList) return res.status(404).json({message: constants.httpResponseMessages.notFound});
			return res.status(200).json(gameList);
		}).populate('games');
	});

	router.post('/games', verifyToken, validateGameQuery, function (req, res) {
		var game = new Game(_.extend(req.body, {owner: req.verified.id}));
		if (!req.body.parentGame) game.parentGame = undefined;
		game.save(function (err) {
			if (err) {
				console.log(err);
				res.status(500);
				res.json({message: constants.httpResponseMessages.internalServerError});
				return;
			}
			game.populate('owner', 'username', function (err) {
				if (err) res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				else return res.status(201).json(game);
			});
		});
	});

	var parseSearchQuery = function (req, res, next) {
		var query = {};
		if (req.query.title) query.title = {'$regex': req.query.title, '$options': 'i'};
		if (req.query.singles) query['pieces.singles'] = {'$lte': req.query.singles};
		if (req.query.doubles) query['pieces.doubles'] = {'$lte': req.query.doubles};
		if (req.query.triples) query['pieces.triples'] = {'$lte': req.query.triples};
		if (req.query.numberOfPlayers) query.numberOfPlayers = {'$lte': req.query.numberOfPlayers};
		if (req.query.owner) query.owner = req.query.owner;
		if (req.query.search) query['$text'] = {$search: req.query.search};
		req.query = query;
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
		Game.find(req.query, '-__v', function (err, game) {
			if (err) res.status(500).json({mesage: constants.httpResponseMessages.internalServerError});
			else res.json(game);
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
			Game.remove({
				_id: req.params.game_id
			}, function (err, game) {
				if (!game) {
					return res.status(404).json({message: constants.httpResponseMessages.notFound});
				}
				if (err) res.send(err);
				else res.status(204).json({message: constants.httpResponseMessages.deleted});
			});
		});

	router.route('/games/:game_id/ratings')
		.put(verifyToken, function (req, res) {
			if (!req.body.rating) {
				return res.status(400).json({message: constants.httpResponseMessages.badRequest});
			}
			Game.findById(req.params.game_id, function (err, game) {
				if (err) {
					return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				}
				if (game === null) return res.status(404).json({message: constants.httpResponseMessages.notFound});
				var newRating;
				var newVoteCount;
				Rating.findOne({_userId: req.verified.id, _gameId: req.params.game_id}, function (err, rating) {
					if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
					if (rating !== null) {
						if (rating.rating === req.params.rating) {
							return res.status(409).json({message: constants.httpResponseMessages.conflict});
						}
						newRating = game.sumOfVotes;
						newRating -= rating.rating;
						newRating += req.body.rating;
						newVoteCount = game.numberOfVotes;
					}
					else {
						newRating = game.sumOfVotes + req.body.rating;
						newVoteCount = game.numberOfVotes;
						newVoteCount++;
					};
					Rating.findOneAndUpdate({_userId: req.verified.id, _gameId: req.params.game_id}, {rating: req.body.rating}, {upsert: true}, function (err) {
						if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
						Game.findOneAndUpdate({_id: req.params.game_id}, {numberOfVotes: newVoteCount, sumOfVotes: newRating}, {upsert: false}, function (err) {
							if (err) {
								return;
							}
							return res.status(204).json({message: constants.httpResponseMessages.ok});
						});
					});
				});
			});
		});
	return router;
};
