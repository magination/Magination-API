var mongoose = require('mongoose');
var Game = require('../game/game.model');

var reviewSchema = new mongoose.Schema({
	owner: {type: mongoose.Schema.Types.ObjectId, ref: 'user', requred: true},
	game: {type: mongoose.Schema.Types.ObjectId, ref: 'game', required: true},
	reviewText: {type: String, required: true},
	rating: {type: Number, required: true},
	createdAt: {type: Date},
	updatedAt: {type: Date}
});

reviewSchema.pre('save', function (next) {
	if (!this.createdAt) this.createdAt = Date.now();
	this.updatedAt = Date.now();
	next();
});

reviewSchema.pre('update', function (next) {
	if (!this.createdAt) this.createdAt = Date.now();
	this.updatedAt = Date.now();
	next();
});

reviewSchema.static.pushToGameAndAddRating = function (gameId, review) {
	Game.findByIdAndUpdate(gameId,
	{$addToSet: {'reviews': review._id}},
	function (err, game) {
		if (err) throw new Error(err);
		game.sumOfVotes += this.rating;
		game.numberOfVotes ++;
		game.save();
	});
};

reviewSchema.static.updateRatingInGame = function (gameId, oldRating, newRating) {
	Game.findById({_id: gameId},
	function (err, game) {
		if (err) throw new Error(err);
		game.sumOfVotes -= oldRating;
		game.sumOfVotes += newRating;
		game.save();
	}
	);
};

reviewSchema.statics.pullFromGameAndRemoveRating = function (gameId, review) {
	Game.findByIdAndUpdate(gameId,
	{$pull: {'reviews': review}},
	function (err, game) {
		if (err) throw new Error(err);
		game.numberOfVotes --;
		game.sumOfVotes -= review.rating;
		game.save();
	}
	);
};

module.exports = mongoose.model('review', reviewSchema);
