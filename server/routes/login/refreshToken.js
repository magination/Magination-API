const jwt = require('jsonwebtoken');
var serverConfig = require('../../config/server.config');
var User = require('../../models/user/user.model');
var constants = require('../../config/constants.config');
var signToken = require('./signToken');

module.exports = function (req, res, next) {
	User.findById(req.verified.id, function (err, user) {
		if (err) return res.status(500).json({message: 'internal server error'});
		if (!user) return res.status(404).json({message: 'user could not be found'});
		if (isNaN(req.verified.userVersion) || isNaN(user.userVersion)) return res.status(400).json({message: constants.httpResponseMessages.badRequest});
		if (parseInt(req.verified.userVersion) !== parseInt(user.userVersion)) return res.status(403).json({message: constants.httpResponseMessages.forbidden});
		req.user = user;
		signToken(req, res, next);
	});
};
