const jwt = require('jsonwebtoken');
var serverConfig = require('../../config/server.config');
var User = require('../../models/user/user.model');
var constants = require('../../config/constants.config');
var signToken = require('./signToken');

module.exports = function (req, res, next) {
	User.findById(req.verified.id, function (err, user) {
		if (err) return res.status(500).send();
		if (!user) return res.status(404).send();
		if (isNaN(req.verified.userVersion) || isNaN(user.userVersion)) return res.status(500).send();
		if (parseInt(req.verified.userVersion) !== parseInt(user.userVersion)) return res.status(403).send();
		req.user = user;
		signToken(req, res, next);
	});
};
