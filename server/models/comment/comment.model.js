var mongoose = require('mongoose');
var Game = require('../game/game.model');

var commentSchema = new mongoose.Schema({
	owner: {type: mongoose.Schema.Types.ObjectId, ref: 'user', requred: true},
	game: {type: mongoose.Schema.Types.ObjectId, ref: 'game', required: true},
	childComments: [{type: mongoose.Schema.Types.ObjectId, ref: 'comment'}],
	commentText: {type: String, required: true},
	createdAt: {type: Date},
	updatedAt: {type: Date}
});

commentSchema.pre('save', function (next) {
	if (!this.createdAt) this.createdAt = Date.now();
	this.updatedAt = Date.now();
	next();
});

commentSchema.pre('update', function (next) {
	if (!this.createdAt) this.createdAt = Date.now();
	this.updatedAt = Date.now();
	next();
});

commentSchema.static.pushToGame = function (game) {
	Game.findByIdAndUpdate(game,
	{$addToSet: {'comments': this._id}},
	function (err, model) {
		if (err) throw new Error(err);
	}
	);
};

commentSchema.statics.pullFromGame = function (game) {
	Game.findByIdAndUpdate(game,
	{$pull: {'comments': this._id}},
	function (err, model) {
		if (err) throw new Error(err);
	}
	);
};

module.exports = mongoose.model('comment', commentSchema);
