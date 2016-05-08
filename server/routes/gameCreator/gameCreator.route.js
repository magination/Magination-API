var express = require('express');
var router = express.Router();
var User = require('../../models/user/user.model');
var Game = require('../../models/game/game.model');
var GameCreator = require('../../models/gameCreator/gameCreator.model');
var Review = require('../../models/review/review.model');
var validator = require('../../validator/validator');
var verifyToken = require('../login/verifyToken');
var mongoose = require('mongoose');
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
	router.post('/users/:userId/gameCreatorObjects', verifyToken, requestValidator, function (req, res) {
		if (req.verified.id !== req.params.userId) return res.status(401).send();
		var gameCreator = new GameCreator({json: JSON.stringify(req.body.json), owner: req.verified.id});
		gameCreator.save(function (err) {
			if (err) return res.status(500).send();
			User.findByIdAndUpdate(req.verified.id, {$push: {gameCreators: gameCreator._id}}, {safe: true, upsert: false}, function (err, user) {
				if (err) {
					winston.log('error', err);
					return res.status(500).send();
				}
				if (!user) return res.status(404).send();
				else return res.status(201).json(gameCreator);
			});
		});
	});

	router.get('/users/:userId/gameCreatorObjects', verifyToken, function (req, res) {
		if (req.params.userId !== req.verified.id) return res.status(401).send();
		GameCreator.find({owner: req.params.userId}, function (err, gameCreators) {
			if (err) {
				winston.log('error', err);
				return res.status(500).send();
			}
			else return res.status(200).json(gameCreators);
		});
	});

	router.put('/users/:userId/gameCreatorObjects/:gameCreatorId', verifyToken, requestValidator, function (req, res) {
		if (!validator.isValidId(req.params.gameCreatorId)) return res.status(404).send();
		if (!req.body.json) return res.status(422).send();
		GameCreator.findById({_id: req.params.gameCreatorId, owner: req.verified.id}, function (err, model) {
			if (err) {
				console.log(err);
				return res.status(500).send();
			}
			if (!model) return res.status(404).send();
			model.json = JSON.stringify(req.body.json);
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

	router.put('/users/:userId/gameCreatorObjects/:gameCreatorId/image', verifyToken, requestValidator, setupMulter, function (req, res) {
		GameCreator.findById({_id: req.params.gameCreatorId, owner: req.verified.id}, function (err, model) {
			if (err) {
				winston.log('error', err);
				return res.status(500).send();
			}
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
	return router;
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
