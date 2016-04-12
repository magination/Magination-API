var mongoose = require('mongoose');

var gameSchema = new mongoose.Schema({
	title: {type: String, required: true},
	mainDescription: {type: String, required: true},
	pieces: {
		singles: {type: Number},
		doubles: {type: Number},
		triples: {type: Number}
	},
	numberOfPlayers: {type: Number},
	owner: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user'},
	comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'comment'}]
});

gameSchema.index({title: 'text', mainDescription: 'text'});
gameSchema.on('index', function (err) {
	if (err) {
		console.error('User index error: %s', err);
	}
	else {
		console.info('User indexing complete');
	}
});
module.exports = mongoose.model('game', gameSchema);
