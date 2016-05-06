var express = require('express');
var router = express.Router();
var User = require('../../models/user/user.model');
var Game = require('../../models/game/game.model');
var Report = require('../../models/report/report.model');
var Review = require('../../models/review/review.model');
var validator = require('../../validator/validator');
var verifyToken = require('../login/verifyToken');
var mongoose = require('mongoose');
var constants = require('../../config/constants.config');
var globalBruteForce = require('../../bruteforce/bruteForce').globalBruteForce;
var userBruteForce = require('../../bruteforce/bruteForce').userBruteForce;

module.exports = function (app) {
	var validatePostRequest = function (req, res, next) {
		if (!req.body.reportText || !req.body.type || !req.body.id) return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		if (!validator.isValidId(req.body.id)) return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		next();
	};

	var checkIfIdExists = function (req, res, next) {
		if (req.body.type === 'game') {
			Game.findById({_id: req.body.id}, function (err, game) {
				if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				if (!game) return res.status(404).json({message: constants.httpResponseMessages.notFound});
				req.body.type = Report.types.GAME;
				next();
			});
		}
		else if (req.body.type === 'review') {
			Review.findById({_id: req.body.id}, function (err, review) {
				if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				if (!review) return res.status(404).json({message: constants.httpResponseMessages.notFound});
				req.body.type = Report.types.REVIEW;
				next();
			});
		}
		else if (req.body.type === 'user') {
			User.findById({_id: req.body.id}, function (err, user) {
				if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				if (!user) return res.status(404).json({message: constants.httpResponseMessages.notFound});
				req.body.type = Report.types.USER;
				next();
			});
		}
		else return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
	};

	var verifyPrivileges = function (req, res, next) {
		if (isNaN(req.verified.privileges)) return res.status(401).json({message: constants.httpResponseMessages.unauthorized});
		if (parseInt(req.verified.privileges) >= User.privileges.MODERATOR) next();
		else return res.status(401).json({message: constants.httpResponseMessages.unauthorized});
	};

	router.post('/reports', validatePostRequest, verifyToken, checkIfIdExists, function (req, res) {
		var newReport = new Report({reportText: req.body.reportText, type: req.body.type, id: req.body.id, owner: req.verified.id});
		newReport.save(function (err) {
			if (err) return res.status(500).json({mesage: constants.httpResponseMessages.internalServerError});
			else return res.status(201).json(newReport);
		});
	});

	router.get('/reports', verifyToken, verifyPrivileges, function (req, res) {
		Report.find({}, function (err, reports) {
			if (err) return res.status(500).json({mesage: constants.httpResponseMessages.internalServerError});
			else return res.status(200).json(reports);
		});
	});

	router.get('/reports/games', verifyToken, verifyPrivileges, function (req, res) {
		Report.find({type: Report.types.GAME}, function (err, reports) {
			if (err) return res.status(500).json({mesage: constants.httpResponseMessages.internalServerError});
			else return res.status(200).json(reports);
		});
	});

	router.get('/reports/users', verifyToken, verifyPrivileges, function (req, res) {
		Report.find({type: Report.types.USER}, function (err, reports) {
			if (err) return res.status(500).json({mesage: constants.httpResponseMessages.internalServerError});
			else return res.status(200).json(reports);
		});
	});

	router.get('/reports/reviews', verifyToken, verifyPrivileges, function (req, res) {
		Report.find({type: Report.types.REVIEW}, function (err, reports) {
			if (err) return res.status(500).json({mesage: constants.httpResponseMessages.internalServerError});
			else return res.status(200).json(reports);
		});
	});

	router.delete('/reports/:id', verifyToken, verifyPrivileges, function (req, res) {
		if (!validator.isValidId(req.params.id)) return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		Report.remove({_id: req.params.id}, function (err) {
			if (err) return res.status(500).json({mesage: constants.httpResponseMessages.internalServerError});
			return res.status(204).json({message: constants.httpResponseMessages.deleted});
		});
	});

	return router;
};
