var mongoose = require('mongoose');
var User = require('../models/user/user.model');

var functions = {
	isValidId: function (id) {
		return mongoose.Types.ObjectId.isValid(id);
	},
	isModerator: function (req) {
		return (req.verified.privileges === User.privileges.ADMINISRATOR);
	},
	isAdmin: function (req) {
		return (req.verified.privileges >= User.privileges.MODERATOR);
	}
};

module.exports = functions;
