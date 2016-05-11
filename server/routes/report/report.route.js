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
		if (!req.body.reportText || !req.body.id) return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		if (!validator.isValidId(req.body.id)) return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		next();
	};

	var checkIfIdExists = function (req, res, next) {
		if (req.body.type === Report.types.GAME) {
			Game.findById({_id: req.body.id}, function (err, game) {
				if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				if (!game) return res.status(404).json({message: constants.httpResponseMessages.notFound});
				next();
			});
		}
		else if (req.body.type === Report.types.REVIEW) {
			Review.findById({_id: req.body.id}, function (err, review) {
				if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				if (!review) return res.status(404).json({message: constants.httpResponseMessages.notFound});
				next();
			});
		}
		else if (req.body.type === Report.types.USER) {
			User.findById({_id: req.body.id}, function (err, user) {
				if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				if (!user) return res.status(404).json({message: constants.httpResponseMessages.notFound});
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

	router.post('/reports/games', validatePostRequest, verifyToken, function (req, res) {
		req.body.type = Report.types.GAME;
		checkIfIdExists(req, res, function () {
			Report.findOne({owner: req.verified.id, id: req.body.id, type: req.body.type}, function (err, report) {
				if (err) return res.status(500).send();
				if (report) return res.status(409).send();
				var newReport = new Report({reportText: req.body.reportText, type: req.body.type, id: req.body.id, owner: req.verified.id});
				newReport.save(function (err) {
					if (err) return res.status(500).json({mesage: constants.httpResponseMessages.internalServerError});
					else return res.status(201).json(newReport);
				});
			});
		});
	});

	router.post('/reports/users', validatePostRequest, verifyToken, function (req, res) {
		req.body.type = Report.types.USER;
		checkIfIdExists(req, res, function () {
			Report.findOne({owner: req.verified.id, id: req.body.id, type: req.body.type}, function (err, report) {
				if (err) return res.status(500).send();
				if (report) return res.status(409).send();
				var newReport = new Report({reportText: req.body.reportText, type: req.body.type, id: req.body.id, owner: req.verified.id});
				newReport.save(function (err) {
					if (err) return res.status(500).json({mesage: constants.httpResponseMessages.internalServerError});
					else return res.status(201).json(newReport);
				});
			});
		});
	});

	router.post('/reports/reviews', validatePostRequest, verifyToken, function (req, res) {
		req.body.type = Report.types.REVIEW;
		checkIfIdExists(req, res, function () {
			Report.findOne({owner: req.verified.id, id: req.body.id, type: req.body.type}, function (err, report) {
				if (err) return res.status(500).send();
				if (report) return res.status(409).send();
				var newReport = new Report({reportText: req.body.reportText, type: req.body.type, id: req.body.id, owner: req.verified.id});
				newReport.save(function (err) {
					if (err) return res.status(500).json({mesage: constants.httpResponseMessages.internalServerError});
					else return res.status(201).json(newReport);
				});
			});
		});
	});

	var findIndex = function (array, id) {
		for (var i = 0; i < array.length; i++) {
			if (array[i].id === id) return i;
		}
		return -1;
	};

	var containsId = function (array, id) {
		for (var i = 0; i < array.length; i++) {
			if (array[i].id === id) return true;
		}
		return false;
	};

	var orderById = function (array) {
		var data = [];
		array.forEach(function (e) {
			var id = e.id;
			var obj = {id: id, reports: []};
			var index = findIndex(data, id);
			if (index < 0) data.push(obj);
			index = findIndex(data, id);
			data[index].reports.push(e);
		});
		return data;
	};

	router.get('/reports/games', verifyToken, verifyPrivileges, function (req, res) {
		var data = {
			type: 'games',
			reportedObjects: []
		};
		Report.find({type: Report.types.GAME}, function (err, reports) {
			if (err) return res.status(500).json({mesage: constants.httpResponseMessages.internalServerError});
			data.reportedObjects = orderById(reports);
			return res.status(200).json(data);
		});
	});

	router.get('/reports/users', verifyToken, verifyPrivileges, function (req, res) {
		var data = {
			type: 'users',
			reportedObjects: []
		};
		Report.find({type: Report.types.USER}, function (err, reports) {
			if (err) return res.status(500).json({mesage: constants.httpResponseMessages.internalServerError});
			data.reportedObjects = orderById(reports);
			return res.status(200).json(data);
		});
	});

	router.get('/reports/reviews', verifyToken, verifyPrivileges, function (req, res) {
		var data = {
			type: 'reviews',
			reportedObjects: []
		};
		Report.find({type: Report.types.REVIEW}, function (err, reports) {
			if (err) return res.status(500).json({mesage: constants.httpResponseMessages.internalServerError});
			data.reportedObjects = orderById(reports);
			return res.status(200).json(data);
		});
	});

	router.delete('/reports/games/:id', verifyToken, verifyPrivileges, function (req, res) {
		if (!validator.isValidId(req.params.id)) return res.status(404).send();
		Report.remove({type: Report.types.GAME, id: req.params.id}, function (err, obj) {
			if (err) return res.status(500).send();
			if (obj.result.n === 0) return res.status(404).send();
			return res.status(204).send();
		});
	});

	router.delete('/reports/users/:id', verifyToken, verifyPrivileges, function (req, res) {
		if (!validator.isValidId(req.params.id)) return res.status(404).send();
		Report.remove({type: Report.types.USER, id: req.params.id}, function (err, obj) {
			if (err) return res.status(500).send();
			if (obj.result.n === 0) return res.status(404).send();
			return res.status(204).send();
		});
	});

	router.delete('/reports/reviews/:id', verifyToken, verifyPrivileges, function (req, res) {
		if (!validator.isValidId(req.params.id)) return res.status(404).send();
		Report.remove({type: Report.types.REVIEW, id: req.params.id}, function (err, obj) {
			if (err) return res.status(500).send();
			if (obj.result.n === 0) return res.status(404).send();
			return res.status(204).send();
		});
	});

	return router;
};
