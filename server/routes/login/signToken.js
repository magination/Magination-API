const jwt = require('jsonwebtoken');
var serverConfig = require('../../config/server.config');

module.exports = function (req, res, next) {
	var token = jwt.sign({
		id: req.user.id,
		userVersion: req.user.userVersion,
		privileges: req.user.privileges,
		expiresIn: 60 * 60
	}, serverConfig.SECRET);

	var refreshToken = jwt.sign({
		id: req.user.id,
		userVersion: req.user.userVersion,
		privileges: req.user.privileges,
		expiresIn: 60 * 60 * 24 * 60
	}, serverConfig.SECRET);

	var data = {
		token: token,
		refreshToken: refreshToken,
		id: req.user.id,
		expiresIn: Date.now() + (60 * 60 * 1000)
	};

	req.data = data;
	next();
};
