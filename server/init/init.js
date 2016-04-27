var mongoose = require('mongoose');
var Game = require('../models/game/game.model');
var GameList = require('../models/gameList/gameList.model');
var crontab = require('node-crontab');
var crontabjobs = require('../cronjobs/cronjobs');
var winston = require('winston');

module.exports = {
	initTopGames: function () {
		GameList.findOne({title: 'topGames'}, function (err, list) {
			if (err) return winston.log('error', err);
			if (!list) {
				// topGames does not exist. Initiate.
				Game.find({sumOfVotes: {$gt: 0}, numberOfVotes: {$gt: 0}}, function (err, games) {
					if (err) return winston.log('error', err);
					games.sort(function (a, b) {
						return parseFloat(a.sumOfVotes / a.numberOfVotes) - parseFloat(b.sumOfVotes / b.numberOfVotes);
					});
					var topGames = new GameList({title: 'topGames'});
					var topGamesList = games.slice(0, 11);
					topGamesList.forEach(function (game) {
						topGames.games.push(game._id);
					});
					topGames.save(function (err) {
						if (err) return winston.log('error', err);
					});
				});
			}
		});
	},
	initFeaturedGames: function () {
		GameList.findOne({title: 'featuredGames'}, function (err, list) {
			if (err) return winston.log('error', err);
			if (!list) {
				// featuredGames does not exist. Initiate.
				var featuredGames = new GameList({title: 'featuredGames'});
				featuredGames.save(function (err) {
					if (err) return winston.log('error', err);
				});
			}
		});
	}
};
