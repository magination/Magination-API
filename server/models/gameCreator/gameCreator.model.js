var mongoose = require('mongoose');

var gameCreatorSchema = new mongoose.Schema({
	json: {type: String},
	image: {type: String},
	owner: {type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true}
});

module.exports = mongoose.model('gameCreator', gameCreatorSchema);
