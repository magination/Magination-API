var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var Promise = require('bluebird');
Promise.promisifyAll(bcrypt);
var uniqueValidator = require('mongoose-unique-validator');

var userSchema = new mongoose.Schema({
	username: {type: String, required: true, unique: true},
	email: {type: String, required: true, unique: true},
	password: {type: String, required: true},
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	updateEmailToken: String,
	updateEmailExpires: Date,
	updateEmailTmp: String,
	userVersion: Number,
	privileges: {type: Number, default: 0, min: 0, max: 2},
	pieces: {
		singles: {type: Number, default: 0, min: 0},
		doubles: {type: Number, default: 0, min: 0},
		triples: {type: Number, default: 0, min: 0}
	},
	images: [String]
});

userSchema.pre('save', function (next) {
	bcrypt.hash(this.password, 10, function (err, hash) {
		if (err) throw new Error(err);
		else {
			this.password = hash;
			if (!this.userVersion) this.userVersion = 1;
			else this.userVersion ++;
			next();
		};
	}.bind(this));
});

userSchema.plugin(uniqueValidator);

userSchema.statics.privileges = {
	USER: 0,
	MODERATOR: 1,
	ADMINISRATOR: 2
};

userSchema.methods.validPassword = function (password) {
	return bcrypt
	.compareAsync(password, this.password)
	.then(function (result, err) {
		if (err) throw new Error(err);
		return result;
	});
};

module.exports = mongoose.model('user', userSchema);
