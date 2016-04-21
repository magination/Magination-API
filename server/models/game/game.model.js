var mongoose = require('mongoose');
var validators = require('mongoose-validators');
var gameSchema = new mongoose.Schema({
	title: {type: String, required: true, autoIndex: true},
	mainDescription: {type: String, maxlength: 255, required: true, autoIndex: true},
	pieces: {
		singles: {type: Number, default: 0, min: 0},
		doubles: {type: Number, default: 0, min: 0},
		triples: {type: Number, default: 0, min: 0}
	},
	numberOfPlayers: {type: Number, default: 0},
	rules: [{type: String}],
	alternativeRules: [{type: String}],
	owner: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user'},
	reviews: [{type: mongoose.Schema.Types.ObjectId, ref: 'review'}],
	numberOfVotes: {type: Number, default: 0},
	sumOfVotes: {type: Number, default: 0},
	images: [{type: String, validate: validators.isURL()}]
});

gameSchema.index({title: 'text', mainDescription: 'text'});

module.exports = mongoose.model('game', gameSchema);
