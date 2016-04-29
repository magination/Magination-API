var mongoose = require('mongoose');
var validators = require('mongoose-validators');
var Game = require('../game/game.model');
var _ = require('lodash');

var unpublishedGameSchema = new mongoose.Schema({
	title: {type: String, required: true},
	shortDescription: {type: String, maxlength: 255, required: true},
	pieces: {
		singles: {type: Number, default: 0, min: 0},
		doubles: {type: Number, default: 0, min: 0},
		triples: {type: Number, default: 0, min: 0}
	},
	numberOfPlayers: {type: Number, default: 0},
	isPlayableWithMorePlayers: {type: Boolean, default: false},
	isPlayableInTeams: {type: Boolean, default: false},
	otherObjects: [{type: String}],
	rules: [{type: String}],
	alternativeRules: [{type: String}],
	owner: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user'},
	reviews: [{type: mongoose.Schema.Types.ObjectId, ref: 'review'}],
	numberOfVotes: {type: Number, default: 0},
	sumOfVotes: {type: Number, default: 0},
	images: [{type: String, validate: validators.isURL()}],
	parentGame: {type: mongoose.Schema.Types.ObjectId, ref: 'game'}
});

unpublishedGameSchema.methods.publishGame = function (callback) {
	/*
	Method that created game from the unpublished game.
	Returns the callback with callback(err, publishedGame).
	 */
	var publishedGame = new Game(_.omit(this.toObject(), ['_id', '__v']));
	publishedGame.save(function (err) {
		if (err) {
			callback(err, null);
		}
		else callback(null, publishedGame);
	});
};

module.exports = mongoose.model('unpublishedGame', unpublishedGameSchema);
