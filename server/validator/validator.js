var mongoose = require('mongoose');

var functions = {
	isValidId: function (id) {
		return mongoose.Types.ObjectId.isValid(id);
	}
};

module.exports = functions;
