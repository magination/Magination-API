var express = require('express');
var router = express.Router();
var User = require('../../models/user/user.model');
var Game = require('../../models/game/game.model');
var GameCreator = require('../../models/gameCreator/gameCreator.model');
var Review = require('../../models/review/review.model');
var validator = require('../../validator/validator');
var verifyToken = require('../login/verifyToken');
var mongoose = require('mongoose');
var UnpublishedGame = require('../../models/unpublishedGame/unpublishedGame.model');
var constants = require('../../config/constants.config');
var config = require('../../config/server.config');
var fs = require('fs');
var globalBruteForce = require('../../bruteforce/bruteForce').globalBruteForce;
var userBruteForce = require('../../bruteforce/bruteForce').userBruteForce;
var logger = require('../../logger/logger');
var storage;
var multer = require('multer');
var winston = require('winston');
var setupMulter = require('../image/multer.setup');

module.exports = function (app) {
	router.post('/unpublishedGames/:gameId/gameCreators', verifyToken, verifyOwnerOfGame, function (req, res) {
		var gameCreator = new GameCreator({json: JSON.stringify(req.body.json), owner: req.verified.id, title: req.body.title});
		gameCreator.save(function (err) {
			if (err) return res.status(500).send();
			Game.findByIdAndUpdate(req.params.gameId, {$push: {gameCreators: gameCreator._id}}, {safe: true, upsert: false}, function (err, game) {
				if (err) {
					logger.log('error', 'POST /unpublishedGames/:gameId/gameCreators', err);
					return res.status(500).send();
				} else if (!game) return res.status(404).send();
				else return res.status(201).json(gameCreator);
			});
		});
	});

	router.get('/unpublishedGames/:gameId/gameCreators', function (req, res) {
		Game.findById(req.params.gameId, function (err, game) {
			if (err) {
				logger.log('error', 'GET /unpublishedGames/:gameId/gameCreators', err);
				return res.status(500).send();
			}
			if (!game) return res.status(404).send();
			return res.status(200).json({gameCreators: game.gameCreators});
		}).populate('gameCreators');
	});

	router.put('/unpublishedGames/:gameId/gameCreators/:gameCreatorId', verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.gameCreatorId)) return res.status(404).send();
		if (!req.body.json && !req.body.title) return res.status(422).send();
		Game.findById({_id: req.params.gameCreatorId, owner: req.verified.id}, function (err, model) {
			if (err) {
				logger.log('error', 'PUT /unpublishedGames/:gameId/gameCreators/:gameCreatorId', err);
				return res.status(500).send();
			}
			if (!model) return res.status(404).send();
			if (!model.owner.equals(req.verified.id)) return res.status(401).send();
			if (req.body.json) model.json = JSON.stringify(req.body.json);
			if (req.body.title) model.title = req.body.title;
			model.save(function (err) {
				if (err) {
					logger.log('error', 'PUT /unpublishedGames/:gameId/gameCreators/:gameCreatorId', err);
					return res.status(500).send();
				} else return res.status(200).json(model);
			});
		});
	});

	router.put('/unpublishedGames/:gameId/gameCreators/:gameCreatorId/image', verifyToken, verfiyOwnerOfGameCreatorAndSetPictureName, setupMulter, function (req, res) {
		Game.findById({_id: req.params.gameCreatorId, owner: req.verified.id}, function (err, model) {
			if (err) {
				logger.log('error', 'PUT /unpublishedGames/:gameId/gameCreators/:gameCreatorId/image', err);
				return res.status(500).send();
			}
			if (!model) return res.status(404).send();
			model.image = req.body.absolutePath;
			model.save(function (err) {
				if (err) {
					logger.log('error', 'PUT /unpublishedGames/:gameId/gameCreators/:gameCreatorId/image', err);
					return res.status(500).send();
				} else return res.status(200).json(model);
			});
		});
	});

	router.delete('/unpublishedGames/:gameId/gameCreators/:gameCreatorId', verifyToken, verifyOwnerOfGame, function (req, res) {
		if (!validator.isValidId(req.params.gameCreatorId)) return res.status(404).send();
		GameCreator.findById({_id: req.params.gameCreatorId, owner: req.verified.id}, function (err, gameCreator) {
			if (err) {
				logger.log('error', 'DELETE /unpublishedGames/:gameId/gameCreators/:gameCreatorId', err);
				return res.status(500).send();
			}
			if (!gameCreator) return res.status(404).send();
			gameCreator.remove(function (err) {
				if (err) {
					logger.log('error', 'DELETE /unpublishedGames/:gameId/gameCreators/:gameCreatorId', err);
					return res.status(500).send();
				}
				Game.findByIdAndUpdate(req.params.gameId, {$pull: {gameCreators: req.params.gameCreatorId}}, {safe: true, upsert: false}, function (err, game) {
					if (err) {
						logger.log('error', 'DELETE /unpublishedGames/:gameId/gameCreators/:gameCreatorId', err);
						return res.status(500).send();
					}
					if (!game) return res.status(404).send();
					else return res.status(200).json(gameCreator);
				});
			});
		});
	});

	return router;
};

var verifyOwnerOfGame = function (req, res, next) {
	/*
	Method that checks if user owns the unpublishedGame
	 */
	if (!validator.isValidId(req.params.gameId)) return res.status(404).send();
	Game.findById(req.params.gameId, function (err, game) {
		if (err) {
			logger.log('error', 'verifyOwnerOfGame() in gameCreator.route', err);
			return res.status(500).send();
		}
		if (!game) return res.status(404).send();
		if (!game.owner.equals(req.verified.id)) return res.status(401).send();
		next();
	});
};

var verfiyOwnerOfGameCreator = function (req, res, next) {
	if (!validator.isValidId(req.params.gameCreatorId)) return res.status(404).send();
	GameCreator.findById(req.params.gameCreatorId, function (err, gameCreator) {
		if (err) {
			logger.log('error', 'verifyOwnerOfGameCreator() in gameCreator.route', err);
			return res.status(500).send();
		}
		if (!gameCreator) return res.status(404).send();
		if (!gameCreator.owner.equals(req.verified.id)) return res.status(401).send();
		next();
	});
};

var verfiyOwnerOfGameCreatorAndSetPictureName = function (req, res, next) {
	if (!validator.isValidId(req.params.gameCreatorId)) return res.status(404).send();
	GameCreator.findById(req.params.gameCreatorId, function (err, gameCreator) {
		if (err) {
			logger.log('error', 'verifyOwnerOfGame() in gameCreator.route', err);
			return res.status(500).send();
		}
		if (!gameCreator) return res.status(404).send();
		if (!gameCreator.owner.equals(req.verified.id)) return res.status(401).send();
		req.params.setPictureName = gameCreator._id.toString() + '.png';
		next();
	});
};

var requestValidator = function (req, res, next) {
	if (req.verified.id !== req.params.userId) return res.status(401).send();
	else next();
};

var storeGameCreatorObject = function (req, res, next) {
	var gameCreator = new GameCreator({json: req.body.jsonData, img: req.body.absolutePath});
	gameCreator.save(function (err) {
		if (err) {
			logger.log('error', 'storeGameCreatorObject() in gameCreator.route', err);
			return res.status(500).send();
		}
		User.findByIdAndUpdate(req.verified.id, {$push: {gameCreators: gameCreator._id}}, {safe: true, upsert: false}, function (err, user) {
			if (err) {
				logger.log('error', 'storeGameCreatorObject() in gameCreator.route', err);
				return res.status(500).send();
			}
			if (!user) return res.status(404).send();
			req.gameCreator = gameCreator;
			next();
		});
	});
};
