var express = require('express');
var router = express.Router();
var Game = require('../../models/game/game.model');
var UnpublishedGame = require('../../models/unpublishedGame/unpublishedGame.model');
var verifyToken = require('../login/verifyToken');
var validator = require('../../validator/validator');
var constants = require('../../config/constants.config');
var _ = require('lodash');
var logger = require('../../logger/logger');
var Report = require('../../models/report/report.model');
var Review = require('../../models/review/review.model');
var winston = require('winston');

module.exports = function (app) {
	var verifyPostRequest = function (req, res, next) {
		if (req.body._id) return res.status(422).json({message: 'An unpublishedGame can not be created with a given _id.'});
		next();
	};

	router.post('/unpublishedGames', verifyToken, verifyPostRequest, function (req, res) {
		var tmpGame = _.omit(req.body, ['rating', 'numberOfVotes', 'sumOfVotes', 'reviews', 'owner']);
		var unpublishedGame = new Game(_.extend(tmpGame, {owner: req.verified.id}));
		if (unpublishedGame.rules) {
			unpublishedGame.rules = unpublishedGame.rules.filter(function (v) { return v !== ''; });
		}
		if (unpublishedGame.alternativeRules) {
			unpublishedGame.alternativeRules = unpublishedGame.alternativeRules.filter(function (v) { return v !== ''; });
		}
		if (!req.body.parentGame) unpublishedGame.parentGame = undefined;
		unpublishedGame.save(function (err) {
			if (err) {
				logger.log('error', 'POST /unpublishedGames', err);
				return res.status(500).send();
			}
			unpublishedGame.populate('owner', 'username', function (err) {
				if (err) {
					logger.log('error', 'POST /unpublishedGames', err);
					return res.status(500).send();
				} else return res.status(201).json(unpublishedGame);
			});
		});
	});

	router.get('/users/:userId/unpublishedGames', verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.userId)) return res.status(422).send();
		if (req.verified.id !== req.params.userId) return res.status(401).send();
		Game.find({owner: req.verified.id, published: false}, function (err, games) {
			if (err) {
				logger.log('error', 'GET /users/:userId/unpublishedGames', err);
				return res.status(500).send();
			} else return res.status(200).json(games);
		});
	});

	router.put('/unpublishedGames/:id', verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.id)) return res.status(422).send();
		var tmpGame = _.omit(req.body, ['rating', 'numberOfVotes', 'sumOfVotes', 'reviews', 'owner']);
		if (tmpGame.parentGame === '') req.body.parentGame = undefined;
		if (tmpGame.rules) {
			tmpGame.rules = tmpGame.rules.filter(function (v) { return v !== ''; });
		}
		if (tmpGame.alternativeRules) {
			tmpGame.alternativeRules = tmpGame.alternativeRules.filter(function (v) { return v !== ''; });
		}
		if (tmpGame.pieces) {
			if (tmpGame.pieces.singles === '') tmpGame.pieces.singles = 0;
			if (tmpGame.pieces.doubles === '') tmpGame.pieces.doubles = 0;
			if (tmpGame.pieces.triples === '') tmpGame.pieces.triples = 0;
		}
		Game.findByIdAndUpdate(req.params.id, tmpGame, function (err, game) {
			if (err) {
				logger.log('error', 'PUT /unpublishedGames/:id', err);
				return res.status(500).send();
			} else if (!game) return res.status(404).send();
			else return res.status(200).json(game);
		});
	});

	router.delete('/unpublishedGames/:id', verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.id)) return res.status(422).send();
		Game.findOne({_id: req.params.id, published: false}, function (err, game) {
			if (err) {
				logger.log('error', 'DELETE /unbpublishedGames/:id', err);
				return res.status(500).send();
			}
			if (!game) return res.status(404).send();
			if (!game.owner.equals(req.verified.id)) return res.status(401).send();
			Game.remove({_id: req.params.id}, function (err, game) {
				if (err) {
					logger.log('error', 'DELETE /unpublishedGames/:id', err);
					return res.status(500).send();
				} else if (!game) return res.status(404).send();
				else {
					Report.removePossibleReports(req.params.id, Report.types.UNPUBLISHED_GAME); // if the game has any reports, these are removed
					Review.removePossibleReviews(req.params.id); // if the gme has ane reviews, these are removed
					return res.status(200).json();
				}
			});
		});
	});

	router.post('/unpublishedGames/:id/publish', verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.id)) return res.status(422).send();
		Game.findOne({_id: req.params.id, published: false}, function (err, game) {
			if (err) return res.status(500).send();
			if (!game) return res.status(404).send();
			if (!game.owner.equals(req.verified.id)) return res.status(401).send();
			if (!game.title || !game.shortDescription) return res.status(422).send();
			Game.findByIdAndUpdate(game._id, {$set: {published: true}}, function (err, publishedGame) {
				if (err || !publishedGame) {
					logger.log('error', 'POST /unpublishedGames/:id/publish', err);
					return res.status(500).send();
				} else {
					return res.status(200).json(publishedGame);
				}
			})
		});
	});

	return router;
};
