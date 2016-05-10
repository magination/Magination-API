var Game = require('../models/game/game.model');
var GameList = require('../models/gameList/gameList.model');
var User = require('../models/user/user.model');
var Report = require('../models/report/report.model');
var Review = require('../models/review/review.model');
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
	},
	removeInvalidReports: function () {
		winston.log('info', 'removeInvalidReports job ran.');
		Report.find({}, function (err, reports) {
			if (err) winston.log('error', 'Err in removeExpiredReports: ' + err);
			for (var i = 0; i < reports.length; i++) {
				if (reports[i].type === Report.types.GAME) {
					Game.findById({_id: reports[i].id}, function (err, game) {
						if (err) winston.log('error', 'Err in removeExpiredReports: ' + err);
						if (!game) {
							reports[i].remove(function (err) {
								if (err) {
									winston.log('error', err);
								}
							});
						}
					});
				}
				else if (reports[i].type === Report.types.USER) {
					User.findById({_id: reports[i].id}, function (err, user) {
						if (err) winston.log('error', 'Err in removeExpiredReports: ' + err);
						if (!user) {
							Report[i].remove(function (err) {
								if (err) {
									winston.log('error', err);
								}
							});
						}
					});
				}
				else if (reports[i].type === Report.types.REVIEW) {
					Review.findById({_id: reports[i].id}, function (err, review) {
						if (err) winston.log('error', 'Err in removeExpiredReports: ' + err);
						if (!review) {
							Report[i].remove(function (err) {
								if (err) {
									winston.log('error', err);
								}
							});
						}
					});
				}
			}
		});
	}
};

module.exports = cronjobs;
