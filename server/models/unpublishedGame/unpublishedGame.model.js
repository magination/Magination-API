var mongoose = require('mongoose');
var validators = require('mongoose-validators');
var Game = require('../game/game.model');
var Review = require('../review/review.model');
var logger = require('../../logger/logger');
var _ = require('lodash');

var unpublishedGameSchema = new mongoose.Schema({
	title: {type: String, trim: true},
	shortDescription: {type: String, maxlength: 255},
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
	rating: {type: Number, default: 0},
	images: [{type: String, validate: validators.isURL()}],
	gameCreators: [{type: mongoose.Schema.Types.ObjectId, ref: 'gameCreator'}],
	parentGame: {type: mongoose.Schema.Types.ObjectId, ref: 'game'}
});

module.exports = mongoose.model('unpublishedGame', unpublishedGameSchema);
