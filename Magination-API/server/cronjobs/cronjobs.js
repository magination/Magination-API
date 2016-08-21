var Game = require('../models/game/game.model');
var GameList = require('../models/gameList/gameList.model');
var User = require('../models/user/user.model');
var mongoose = require('mongoose');
var winston = require('winston');

var cronjobs = {
	removeExpiredResetPasswordTokens: function () {
		/*
		If the resetPassword-token is not used within the set expiration time, the token is removed.
		 */
		User.update({resetPasswordExpires: { $lt: Date.now() }},
			{
				resetPasswordExpires: undefined,
				resetPasswordToken: undefined
			}, function (err, obj) {
				if (err) {
					winston.log('error', err);
					return;
				}
				if (obj.nModified > 0) winston.log('info', 'removeExpiredResetPasswordTokens() removed ' + obj.nModified + ' expired reset password tokens.');
			});
	},
	removeExpiredUpdateEmailTokens: function () {
		/*
		If the update-email token is not used within the set expiration time, the token and temp email is removed.
		 */
		User.update({updateEmailExpires: { $lt: Date.now() }},
			{
				updateEmailExpires: undefined,
				updateEmailToken: undefined,
				updateEmailTmp: undefined
			}, function (err, obj) {
				if (err) {
					winston.log('error', err);
					return;
				}
				if (obj.nModified > 0) winston.log('info', 'removeExpiredUpdateEmailTokens() removed ' + obj.nModified + ' expired update email tokens.');
			});
	},
	removeExpiredConfirmEmailUsers: function () {
		/*
		Users that has not confirmed their email after the set time expires are removed from the DB.
		 */
		User.remove({confirmEmailExpires: { $lt: Date.now() }}, function (err, obj) {
			if (err) {
				winston.log('error', err);
				return;
			}
			if (obj.result.n > 0) winston.log('info', 'removeExpiredConfirmEmailTokens() removed ' + obj.result.n + ' expired users due to expired confirmEmailToken.');
		});
	}
};

module.exports = cronjobs;
