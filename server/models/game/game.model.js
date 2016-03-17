/**
 * Created by petteriversen on 16.03.16.
 */
var mongoose = require('mongoose');

var gameSchema = new mongoose.Schema({
    title: {type:String, required:true},
    description: {type:String, required:true},
    //owner: { type:mongoose.Schema.Types.ObjectId, required:true, ref:'user'} TODO: Reference user instead of containing owner name
    owner: {type:String, required:true}
})

module.exports = mongoose.model('game', gameSchema);