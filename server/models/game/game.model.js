var mongoose = require('mongoose');

var gameSchema = new mongoose.Schema({
	title: {type: String, required: true, autoIndex: true},
	mainDescription: {type: String, required: true, autoIndex: true},
	pieces: {
		singles: {type: Number, default: 0, min: 0},
		doubles: {type: Number, default: 0, min: 0},
		triples: {type: Number, default: 0, min: 0}
	},
	numberOfPlayers: {type: Number, default: 0},
	owner: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user'},
	comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'comment'}],
	numberOfVotes: {type: Number, default: 0},
	sumOfVotes: {type: Number, default: 0}
});

gameSchema.index({title: 'text', mainDescription: 'text'});

module.exports = mongoose.model('game', gameSchema);
