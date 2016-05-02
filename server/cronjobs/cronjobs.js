var Game = require('../models/game/game.model');
var GameList = require('../models/gameList/gameList.model');
var User = require('../models/user/user.model');
var mongoose = require('mongoose');
var winston = require('winston');
var init = require('../init/init');

var cronjobs = {
	removeExpiredResetPasswordTokens: function () {
		User.update({resetPasswordExpires: { $lt: Date.now() }},
			{
				resetPasswordExpires: undefined,
				resetPasswordToken: undefined
			}, function (err) {
				if (err) {
					winston.log('error', err);
					return;
				}
				winston.log('info', 'removeExpiredResetPasswordTokens job ran.');
			});
	},
	removeExpiredUpdateEmailTokens: function () {
		User.update({updateEmailExpires: { $lt: Date.now() }},
			{
				updateEmailExpires: undefined,
				updateEmailToken: undefined,
				updateEmailTmp: undefined
			}, function (err) {
				if (err) {
					winston.log('error', err);
					return;
				}
				winston.log('info', 'removeExpiredUpdateEmailTokens job ran.');
			});
	}
};

module.exports = cronjobs;
