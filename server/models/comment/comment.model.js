var mongoose = require('mongoose');
var Game = require('../game/game.model');

var commentSchema = new mongoose.Schema({
	_userId: {type: mongoose.Schema.Types.ObjectId, ref: 'user', requred: true},
	_gameId: {type: mongoose.Schema.Types.ObjectId, ref: 'game', required: true},
	commentText: {type: String, required: true},
	createdAt: {type: Date},
	updatedAt: {type: Date}
});

commentSchema.pre('save', function (next) {
	this.createdAt = Date.now();
	next();
});

commentSchema.pre('update', function (next) {
	this.updatedA = Date.now();
});

commentSchema.post('save', function (next) {
	console.log(this._gameId);
	Game.findByIdAndUpdate(this._gameId,
	{$push: {'comments': this._id}},
	function (err, model) {
		if (err) throw new Error(err);
	}
	);
});

commentSchema.post('remove', function (next) {
	Game.findByIdAndUpdate(this._gameId,
	{$pull: {'comments': this._id}},
	function (err, model) {
		if (err) throw new Error(err);
	}
	);
});

module.exports = mongoose.model('comment', commentSchema);
