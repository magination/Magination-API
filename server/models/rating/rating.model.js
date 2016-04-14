var mongoose = require('mongoose');

var ratingSchema = new mongoose.Schema({
	_userId: {type: mongoose.Schema.Types.ObjectId, ref: 'user', requred: true},
	_gameId: {type: mongoose.Schema.Types.ObjectId, ref: 'game', required: true},
	rating: {type: Number, required: true, min: 1, max: 5}
});

module.exports = mongoose.model('rating', ratingSchema);
