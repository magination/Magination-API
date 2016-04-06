
var User = require('../../models/user/user.model');

module.exports = function (req, res, next) {
	/*
	TODO: find a more efficient way.
	 */
	User.findOne({ username: req.body.username }, function (err, user) {
		if (err) return res.status(500).json({message: 'internal server error'});
		else if (user) return res.status(409).json({message: 'username allready exists'});

		User.findOne({ email: req.body.email }, function (err, user) {
			if (err) return res.status(500).json({message: 'internal server error'});
			else if (user) return res.status(409).json({message: 'email allready exists'});
			next();
		});
	});
};
