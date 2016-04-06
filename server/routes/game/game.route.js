var express = require('express');
var router = express.Router();
var Game = require('../../models/game/game.model');
var decodeToken = require('../login/decodeToken');

router.use(function (req, res, next) {
	next();
});

module.exports = function (app) {
	router.route('/games')
		.post(decodeToken, function (req, res) {
			if (!req.body.title || !req.body.shortDescription || !req.body.mainDescription) {
				res.status(400);
				res.json({message: 'bad request. A game should include a title, shortDescription, mainDescription and owner (id).'});
				return;
			}
			var game = new Game();
			game.title = req.body.title;
			game.shortDescription = req.body.shortDescription;
			game.mainDescription = req.body.mainDescription;
			game.owner = req.decoded.id;

			game.save(function (err) {
				if (err) {
					console.log(err);
					res.status(500);
					res.json({message: 'Internal server error.'});
					return;
				}
				res.status(201);
				res.json({
					message: 'Game ' + game.id + ' created!'
				});
			});
		})
		.get(function (req, res) {
			Game.find(function (err, game) {
				if (err) res.status(500).json({message: 'Internal server error.'});
				else res.json(game);
			}).populate('owner', 'username');
		});

	router.route('/games/:game_id')
		.get(function (req, res) {
			Game.findById(req.params.game_id, function (err, game) {
				if (err) res.send(err);
				if (game == null) res.status(404).json({message: 'Game not found.'});
				else res.json(game);
			}).populate('owner', 'username');
		})
		.delete(decodeToken, function (req, res) {
			Game.remove({
				_id: req.params.game_id
			}, function (err, game) {
				if (!game) {
					res.status(404);
					res.json({message: 'Game with given id not found'});
					return;
				}
				if (err) res.send(err);
				else res.json({ message: 'Successfully deleted game ' + req.params.game_id });
			});
		});

	return router;
};
