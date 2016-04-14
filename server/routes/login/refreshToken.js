const jwt = require('jsonwebtoken');
var serverConfig = require('../../config/server.config');
var User = require('../../models/user/user.model');

module.exports = function (req, res, next) {
	User.findById(req.decoded.id, function (err, user) {
		if (err) return res.status(500).json({message: 'internal server error'});
		if (!user) return res.status(404).json({message: 'user could not be found'});
		if (req.decoded.password !== user.password) return res.status(403).json({message: 'forbidden'});

		var hash = jwt.sign({
			id: user.id,
			username: user.username,
			email: user.email,
			password: user.password,
			expiresIn: 60 * 60 * 12
		}, serverConfig.SECRET);

		var data = {
			token: hash,
			id: user.id,
			expiresIn: Date.now() + (60 * 60 * 12 * 1000)
		};
		req.refreshedToken = data;
		next();
	});
};
