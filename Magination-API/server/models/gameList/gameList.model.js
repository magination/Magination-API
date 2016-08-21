var mongoose = require('mongoose');
var logger = require('../../logger/logger');

var gameListSchema = new mongoose.Schema({
	title: {type: String, unique: true},
	games: [{type: mongoose.Schema.Types.ObjectId, ref: 'game'}]
});

gameListSchema.statics.removePossibleGame = function (title, gameId) {
	// If the list contains the id, this id is removed.
	// Is called when a user unpublishes a game.
	this.findOneAndUpdate({title: title}, {$pull: {'games': gameId}}, function (err, gameList) {
		if (err) {
			logger.log('error', 'removePossibleGame() in gameList.model', err);
		}
	});
};

module.exports = mongoose.model('gameList', gameListSchema);
