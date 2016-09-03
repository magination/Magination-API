var express = require('express');
var router = express.Router();
var User = require('../../models/user/user.model');
var validator = require('../../validator/validator');
var verifyToken = require('../login/verifyToken');
var serverConfig = require('../../config/server.config');
var userConfig = require('../../config/user.config');
var logger = require('../../logger/logger');

module.exports = function (app) {
	router.get('/moderators', verifyToken, function (req, res) {
		if (!validator.isAdmin(req)) return res.status(401).send();
		User.find({privileges: User.privileges.MODERATOR}, function (err, users) {
			if (err) {
				logger.log('err', 'GET /users/moderators', err);
				return res.status(500).send();
			} else return res.status(200).json(users);
		}).select('username');
	});

	router.post('/moderators/:username', verifyToken, function (req, res) {
		if (!validator.isAdmin(req)) return res.status(401).send();
		User.findOneAndUpdate({username_lower: req.params.username.toLowerCase()}, {privileges: User.privileges.MODERATOR}, function (err, user) {
			if (err) {
				logger.log('err', 'GET /users/moderators', err);
				return res.status(500).send();
			}
			if (!user) return res.status(404).send();
			else return res.status(200).send();
		});
	});

	router.delete('/moderators/:username', verifyToken, function (req, res) {
		if (!validator.isAdmin(req)) return res.status(401).send();
		User.findOneAndUpdate({username_lower: req.params.username.toLowerCase()}, {privileges: User.privileges.USER}, function (err, user) {
			if (err) {
				logger.log('err', 'GET /users/moderators', err);
				return res.status(500).send();
			}
			if (!user) return res.status(404).send();
			else return res.status(200).send();
		});
	});

	return router;
};
