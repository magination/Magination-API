var mongoose = require('mongoose');

var gameListSchema = new mongoose.Schema({
	title: {type: String, unique: true},
	games: [{type: mongoose.Schema.Types.ObjectId, ref: 'game'}]
});

module.exports = mongoose.model('gameList', gameListSchema);
