var Game = require('../models/game/game.model');
var GameList = require('../models/gameList/gameList.model');
var User = require('../models/user/user.model');
var mongoose = require('mongoose');
var winston = require('winston');
var init = require('../init/init');

var cronjobs = {
	updateTopGames: function () {
		GameList.findOne({title: 'topGames'}, function (err, list) {
			if (err) {
				winston.log('error', err);
				return;
			}
			if (!list) {
				winston.log('info', 'updateTopGames job ran. Did not find a topGames list to update.');
			}
			else {
				Game.find({}, function (err, games) {
					if (err) return winston.log('error', err);
					games.sort(function (a, b) {
						return parseFloat(a.sumOfVotes / a.numberOfVotes) - parseFloat(b.sumOfVotes / b.numberOfVotes);
					});
					list.games = [];
					var topGamesList = games.slice(0, 11);
					topGamesList.forEach(function (game) {
						list.games.push(game._id);
					});
					list.save(function (err) {
						if (err) {
							winston.log('error', err);
							return;
						}
						winston.log('info', 'updateTopGames job ran.');
					});
				});
			}
		});
	},
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
