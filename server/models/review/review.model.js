var mongoose = require('mongoose');
var Game = require('../game/game.model');
var logger = require('../../logger/logger');
var winston = require('winston');

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

reviewSchema.statics.pushToGameAndAddRating = function (gameId, review) {
	Game.findByIdAndUpdate(gameId,
	{$addToSet: {'reviews': review._id}},
	function (err, game) {
		if (err) {
			logger.log('error', 'pushToGameAndAddRating() in review.model', err);
			return;
		}
		game.sumOfVotes += review.rating;
		game.numberOfVotes ++;
		game.rating = (game.sumOfVotes / game.numberOfVotes);
		game.save(function (err) {
			if (err) {
				logger.log('error', 'pushToGameAndAddRating() in review.model', err);
				return;
			}
		});
	});
};

reviewSchema.statics.updateRatingInGame = function (gameId, oldRating, newRating) {
	Game.findById({_id: gameId},
	function (err, game) {
		if (err) {
			logger.log('error', 'updateRatingInGame() in review.model', err);
			return;
		}
		var newSumOfVotes = (game.sumOfVotes - oldRating + newRating);
		var newAvgRating = (newSumOfVotes / game.numberOfVotes);

		Game.findByIdAndUpdate(gameId,
		{sumOfVotes: newSumOfVotes, rating: newAvgRating},
		function (err, game) {
			if (err) {
				logger.log('error', 'updateRatingInGame() in review.model', err);
				return;
			}
		});
	});
};

reviewSchema.statics.pullFromGameAndRemoveRating = function (gameId, review) {
	Game.findByIdAndUpdate(gameId,
	{$pull: {'reviews': review._id}},
	function (err, game) {
		if (err) {
			logger.log('error', 'pullFromGameAndRemoveRating() in review.model', err);
			return;
		}
		game.numberOfVotes --;
		game.sumOfVotes -= review.rating;
		if (game.sumOfVotes === 0) {
			game.rating = 0;
		} else {
			game.rating = (game.sumOfVotes / game.numberOfVotes);
		}
		game.save(function (err) {
			if (err) {
				logger.log('error', 'pullFromGameAndRemoveRating() in review.model', err);
				return;
			}
		});
	}
	);
};

reviewSchema.statics.removePossibleReviews = function (gameId) {
	// If a game is deleted, possible reviews of that game is removed.
	this.remove({game: gameId}, function (err, reports) {
		if (err) {
			logger.log('error', 'removePossibleReviews() in review.model', err);
		}
	});
};

module.exports = mongoose.model('review', reviewSchema);
