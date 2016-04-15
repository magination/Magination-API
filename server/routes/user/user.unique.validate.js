
var User = require('../../models/user/user.model');

module.exports = function (req, res, next) {
	User.findOne({ username: req.body.username }, function (err, user) {
		if (err) return res.status(500).json({message: 'internal server error'});
		else if (user) return res.status(409).json({message: 'Username already exists'});
		else if (user.email === req.body.email) return res.status(409).json({message: 'Email in use'});
		next();
	});
};
