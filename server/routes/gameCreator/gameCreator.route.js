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
var storage;
var multer = require('multer');
var winston = require('winston');
var setupMulter = require('../image/multer.setup');

module.exports = function (app) {
	router.post('/unpublishedGames/:gameId/gameCreators', verifyToken, verifyOwnerOfGame, function (req, res) {
		var gameCreator = new GameCreator({json: JSON.stringify(req.body.json), owner: req.verified.id});
		gameCreator.save(function (err) {
			if (err) return res.status(500).send();
			UnpublishedGame.findByIdAndUpdate(req.params.gameId, {$push: {gameCreators: gameCreator._id}}, {safe: true, upsert: false}, function (err, game) {
				if (err) {
					winston.log('error', err);
					return res.status(500).send();
				}
				if (!game) return res.status(404).send();
				else return res.status(201).json(gameCreator);
			});
		});
	});

	router.get('/unpublishedGames/:gameId/gameCreators', function (req, res) {
		UnpublishedGame.findById(req.params.gameId, function (err, game) {
			if (err) return res.status(500).send();
			if (!game) return res.status(404).send();
			return res.status(200).json({gameCreators: game.gameCreators});
		}).populate('gameCreators');
	});

	router.put('/unpublishedGames/:gameId/gameCreators/:gameCreatorId', verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.gameCreatorId)) return res.status(404).send();
		if (!req.body.json && !req.body.title) return res.status(422).send();
		GameCreator.findById({_id: req.params.gameCreatorId, owner: req.verified.id}, function (err, model) {
			if (err) {
				console.log(err);
				return res.status(500).send();
			}
			if (!model) return res.status(404).send();
			if (!model.owner.equals(req.verified.id)) return res.status(401).send();
			if (req.body.json) model.json = JSON.stringify(req.body.json);
			if (req.body.tile) model.title = req.body.title;
			model.save(function (err) {
				if (err) {
					winston.log('error', err);
					console.log(err);
					return res.status(500).send();
				}
				else return res.status(200).json(model);
			});
		});
	});

	router.put('/unpublishedGames/:gameId/gameCreators/:gameCreatorId/image', verifyToken, verfiyOwnerOfGameCreatorAndSetPictureName, setupMulter, function (req, res) {
		GameCreator.findById({_id: req.params.gameCreatorId, owner: req.verified.id}, function (err, model) {
			if (err) {
				winston.log('error', err);
				return res.status(500).send();
			}
			if (!model) return res.status(404).send();
			model.image = req.body.absolutePath;
			model.save(function (err) {
				if (err) {
					winston.log('error', err);
					return res.status(500).send();
				}
				else return res.status(200).json(model);
			});
		});
	});

	router.delete('/unpublishedGame/:gameId/gameCreators/:gameCreatorId', verifyToken, function (req, res) {
		if (req.params.userId !== req.verified.id) return res.status(401).send();
		if (!validator.isValidId(req.params.gameCreatorId)) return res.status(404).send();
		GameCreator.remove({_id: req.params.gameCreatorId, owner: req.verified.id}, function (err, gameCreator) {
			if (err) {
				winston.log('error', err);
				return res.status(500).send();
			}
			if (!gameCreator) return res.status(404).send();
			UnpublishedGame.findByIdAndUpdate(req.verified.id, {$pull: {gameCreators: req.params.gameCreatorId}}, {safe: true, upsert: false}, function (err, game) {
				if (err) {
					winston.log('error', err);
					return res.status(500).send();
				}
				if (!game) return res.status(404).send();
				else return res.status(204).send();
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
	UnpublishedGame.findById(req.params.gameId, function (err, game) {
		if (err) return res.status(500).send();
		if (!game) return res.status(404).send();
		if (!game.owner.equals(req.verified.id)) return res.status(401).send();
		next();
	});
};

var verfiyOwnerOfGameCreator = function (req, res, next) {
	if (!validator.isValidId(req.params.gameCreatorId)) return res.status(404).send();
	GameCreator.findById(req.params.gameId, function (err, gameCreator) {
		if (err) return res.status(500).send();
		if (!gameCreator) return res.status(404).send();
		if (!gameCreator.owner.equals(req.verified.id)) return res.status(401).send();
		next();
	});
};

var verfiyOwnerOfGameCreatorAndSetPictureName = function (req, res, next) {
	if (!validator.isValidId(req.params.gameCreatorId)) return res.status(404).send();
	GameCreator.findById(req.params.gameCreatorId, function (err, gameCreator) {
		if (err) return res.status(500).send();
		if (!gameCreator) return res.status(404).send();
		if (!gameCreator.owner.equals(req.verified.id)) return res.status(401).send();
		req.body.setPictureName = gameCreator._id;
		next();
	});
};

var requestValidator = function (req, res, next) {
	if (req.verified.id !== req.params.userId) return res.status(401).send();
	next();
};

var storeGameCreatorObject = function (req, res, next) {
	var gameCreator = new GameCreator({json: req.body.jsonData, img: req.body.absolutePath});
	gameCreator.save(function (err) {
		if (err) return res.status(500).send();
		User.findByIdAndUpdate(req.verified.id, {$push: {gameCreators: gameCreator._id}}, {safe: true, upsert: false}, function (err, user) {
			if (err) {
				winston.log('error', err);
				return res.status(500).send();
			}
			if (!user) return res.status(404).send();
			req.gameCreator = gameCreator;
			next();
		});
	});
};
