
var mongoose = require('mongoose');

var gameSchema = new mongoose.Schema({
    title: {type:String, required:true},
    shortDescription: {type:String, required:true},
    mainDescription: {type:String, required:true},
    owner: { type:mongoose.Schema.Types.ObjectId, required:true, ref:'user'},
});

module.exports = mongoose.model('game', gameSchema);