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
var winston = require('winston');

module.exports = function (app) {
	var verifyPostRequest = function (req, res, next) {
		if (req.body._id) return res.status(422).json({message: 'An unpublishedGame can not be created with a given _id.'});
		next();
	};

	router.post('/unpublishedGames', verifyToken, verifyPostRequest, function (req, res) {
		var unpublishedGame = new UnpublishedGame(_.extend(req.body, {owner: req.verified.id}));
		if (unpublishedGame.rules) {
			unpublishedGame.rules = unpublishedGame.rules.filter(function (v) { return v !== ''; });
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
				}
				else return res.status(201).json(unpublishedGame);
			});
		});
	});

	router.get('/users/:userId/unpublishedGames', verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.userId)) return res.status(422).send();
		if (req.verified.id !== req.params.userId) return res.status(401).send();
		UnpublishedGame.find({owner: req.verified.id}, function (err, games) {
			if (err) {
				logger.log('error', 'GET /users/:userId/unpublishedGames', err);
				return res.status(500).send();
			}
			else return res.status(200).json(games);
		});
	});

	router.put('/unpublishedGames/:id', verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.id)) return res.status(422).send();
		if (req.body.parentGame === '') req.body.parentGame = undefined;
		UnpublishedGame.findOneAndUpdate({_id: req.params.id, owner: req.verified.id}, req.body, {new: true}, function (err, game) {
			if (err) {
				logger.log('error', 'PUT /unpublishedGames/:id', err);
				return res.status(500).send();
			}
			else if (!game) return res.status(404).send();
			else return res.status(200).json(game);
		});
	});

	router.delete('/unpublishedGames/:id', verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.id)) return res.status(422).send();
		UnpublishedGame.findById({_id: req.params.id}, function (err, game) {
			if (err) {
				logger.log('error', 'DELETE /unbpublishedGames/:id', err);
				return res.status(500).send();
			}
			if (!game) return res.status(404).send();
			if (!game.owner.equals(req.verified.id)) return res.status(401).send();
			UnpublishedGame.remove({_id: req.params.id}, function (err, game) {
				if (err) {
					logger.log('error', 'DELETE /unpublishedGames/:id', err);
					return res.status(500).send();
				}
				else if (!game) return res.status(404).send();
				else res.status(200).json();
			});
		});
	});

	router.post('/unpublishedGames/:id/publish', verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.id)) return res.status(422).send();
		UnpublishedGame.findById({_id: req.params.id}, function (err, game) {
			if (err) return res.status(500).send();
			if (!game) return res.status(404).send();
			if (!game.owner.equals(req.verified.id)) return res.status(401).send();
			if (!game.title || !game.shortDescription) return res.status(422).send();
			game.publishGame(function (err, publishedGame) {
				if (err) {
					if (err.code === 11000) return res.status(409).send(); // duplicate key. Title is in use.
					else {
						logger.log('error', 'POST /unpublishedGames/:id/publish', err);
						return res.status(500).send();
					}
				}
				if (!publishedGame) return res.status(404).send();
				UnpublishedGame.findByIdAndRemove({_id: game._id}, function (err) {
					if (err) {
						logger.log('error', 'POST /unpublishedGames/:id/publish', err);
						return res.status(500).send();
					}
					else {
						moveReportsFromUnpublishedToPublishedGame(game, publishedGame);
						return res.status(200).json(publishedGame);
					}
				});
			});
		});
	});

	return router;
};

var moveReportsFromUnpublishedToPublishedGame = function (oldGame, newGame) {
	/*
	method to update reports when a game is published/unpublished.
	 */
	Report.find({id: oldGame._id, type: Report.types.UNPUBLISHED_GAME}, function (err, reports) {
		if (err) winston.log('error', err);
		reports.forEach(function (report) {
			report.id = newGame._id;
			report.type = Report.types.GAME;
			report.save(function (err) {
				if (err) winston.log('error', err);
			});
		});
	});
};
