var mongoose = require('mongoose');
var Game = require('../models/game/game.model');
var GameList = require('../models/gameList/gameList.model');
var crontab = require('node-crontab');
var crontabjobs = require('../cronjobs/cronjobs');
var winston = require('winston');

module.exports = {
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
