var mongoose = require('mongoose');

var reportSchema = new mongoose.Schema({
	reportText: {type: String, required: true},
	reportedAt: {type: Date, default: Date.now()},
	owner: {type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true},
	type: {type: Number, min: 1, max: 4, required: true},
	id: {type: String, required: true}
});

reportSchema.statics.types = {
	GAME: 1,
	USER: 2,
	REVIEW: 3,
	UNPUBLISHED_GAME: 4
};

module.exports = mongoose.model('report', reportSchema);
