var express = require('express');
var router = express.Router();
var authenticate = require('./authenticate');
var generateToken = require('./generateToken');

module.exports = function (app) {
	router.post('/login', authenticate, generateToken, function (req, res, next) {
		if (req.user && req.data) {
			return res.status(200).json(req.data);
		}
		else {
			return res.status(500).json({message: 'internal server error'});
		}
	});
	return router;
};
