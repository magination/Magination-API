var validator = require('validator');
var userConfig = require('../../config/user.config');

module.exports = function (req, res, next) {
	if (!req.body.username || !req.body.email || !req.body.password) {
		res.status(400);
		return res.json({message: 'Invalid request parameters'});
	}
	if (!validator.isEmail(req.body.email)) {
		res.status(422);
		return res.json({message: 'The email field must contain a valid email address'});
	}
	if (req.body.password.length < userConfig.MIN_PASSWORD_LENGTH) return res.status(422).json({message: 'A password must contain atleast ' + userConfig.MIN_PASSWORD_LENGTH + ' charachters.'});
	next();
};
