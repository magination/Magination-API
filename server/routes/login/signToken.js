const jwt = require('jsonwebtoken');
var serverConfig = require('../../config/server.config');
var tokenConstants = require('./token.constants');

module.exports = function (req, res, next) {
	var token = jwt.sign({
		id: req.user.id,
		userVersion: req.user.userVersion,
		privileges: req.user.privileges,
		type: tokenConstants.TYPES.ACCESS_TOKEN
	}, serverConfig.SECRET, {expiresIn: (60 * 60)});

	var refreshToken = jwt.sign({
		id: req.user.id,
		userVersion: req.user.userVersion,
		privileges: req.user.privileges,
		type: tokenConstants.TYPES.REFRESH_TOKEN
	}, serverConfig.SECRET, {expiresIn: (60 * 60 * 24 * 60)});

	var data = {
		token: token,
		refreshToken: refreshToken
	};

	req.data = data;
	next();
};
