var express = require('express');
var router = express.Router();
var authenticate = require('./authenticate');
var generateToken = require('./generateToken');
var decodeToken = require('./decodeToken');
var refreshToken = require('./refreshToken');
var constants = require('../../config/constants.config');

module.exports = function (app) {
	router.post('/login', authenticate, generateToken, function (req, res, next) {
		if (req.user && req.data) return res.status(200).json(req.data);
		else return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
	});

	router.get('/login/refresh', decodeToken, refreshToken, function (req, res) {
		if (req.refreshedToken) return res.status(200).json(req.refreshedToken);
		else return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
	});

	return router;
};
