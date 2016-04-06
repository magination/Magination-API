var validator = require('validator');

module.exports = function (req, res, next) {
	if (!req.body.username || !req.body.email || !req.body.password) {
		res.status(400);
		return res.json({message: 'invalid request parameters'});
	}
	if (!validator.isEmail(req.body.email)) {
		res.status(400);
		return res.json({message: 'the email field must contain a valid email-adress'});
	}

	next();
};
