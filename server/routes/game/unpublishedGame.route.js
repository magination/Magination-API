var express = require('express');
var router = express.Router();
var Game = require('../../models/game/game.model');
var UnpublishedGame = require('../../models/unpublishedGame/unpublishedGame.model');
var verifyToken = require('../login/verifyToken');
var validator = require('../../validator/validator');
var constants = require('../../config/constants.config');
var _ = require('lodash');
var Report = require('../../models/report/report.model');
var winston = require('winston');

module.exports = function (app) {
	var verifyPostRequest = function (req, res, next) {
		if (req.body._id) return res.status(422).json({message: 'A unpublishedGame can not be created with a given _id.'});
		next();
	};

	router.post('/unpublishedGames', verifyToken, verifyPostRequest, function (req, res) {
		var unpublishedGame = new UnpublishedGame(_.extend(req.body, {owner: req.verified.id}));
		if (!req.body.parentGame) unpublishedGame.parentGame = undefined;
		unpublishedGame.save(function (err) {
			if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			unpublishedGame.populate('owner', 'username', function (err) {
				if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				else return res.status(201).json(unpublishedGame);
			});
		});
	});

	router.get('/users/:userId/unpublishedGames', verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.userId)) return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		if (req.verified.id !== req.params.userId) return res.status(401).json({message: constants.httpResponseMessages.forbidden});
		UnpublishedGame.find({owner: req.verified.id}, function (err, games) {
			if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			else return res.status(200).json(games);
		});
	});

	router.put('/unpublishedGames/:id', verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.id)) return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		if (req.body.parentGame === '') req.body.parentGame = undefined;
		UnpublishedGame.findOneAndUpdate({_id: req.params.id, owner: req.verified.id}, req.body, {new: true}, function (err, game) {
			if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			if (!game) return res.status(404).json({message: constants.httpResponseMessages.notFound});
			return res.status(200).json(game);
		});
	});

	router.delete('/unpublishedGames/:id', verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.id)) return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		UnpublishedGame.findById({_id: req.params.id}, function (err, game) {
			if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			if (!game) return res.status(404).json({message: constants.httpResponseMessages.notFound});
			if (!game.owner.equals(req.verified.id)) return res.status(401).json({message: constants.httpResponseMessages.unauthorized});
			UnpublishedGame.remove({_id: req.params.id}, function (err, game) {
				if (!game) return res.status(404).json({message: constants.httpResponseMessages.notFound});
				if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
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
					return res.status(500).send();
				}
				if (!publishedGame) return res.status(404).json({message: constants.httpResponseMessages.notFound});
				UnpublishedGame.findByIdAndRemove({_id: game._id}, function (err) {
					if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
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
