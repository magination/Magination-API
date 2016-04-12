const jwt = require('jsonwebtoken');
var serverConfig = require('../../config/server.config');

module.exports = function (req, res, next) {
	var hash = jwt.sign({
		id: req.user.id,
		username: req.user.username,
		email: req.user.email,
		password: req.user.password,
		expiresIn: 60 * 60 * 12
	}, serverConfig.SECRET);

	var data = {
		token: hash,
		id: req.user.id,
		expiresIn: Date.now() + (60 * 60 * 12 * 1000)
	};

	req.data = data;
	next();
};
