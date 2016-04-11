var mongoose = require('mongoose');

var ratingSchema = new mongoose.Schema({
	_user: {type: mongoose.Schema.Types.ObjectId, ref: 'user', requred: true},
	_game: {type: mongoose.Schema.Types.ObjectId, ref: 'game', required: true},
	rating: {type: Number, required: true, min: 1, max: 5}
});

module.exports = mongoose.model('rating', ratingSchema);
