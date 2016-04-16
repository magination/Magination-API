var express = require('express');
var router = express.Router();
var Game = require('../../models/game/game.model');
var User = require('../../models/user/user.model');
var decodeToken = require('../login/decodeToken');
var Rating = require('../../models/rating/rating.model');

router.use(function (req, res, next) {
	next();
});

module.exports = function (app) {
	router.route('/games')
		.post(decodeToken, function (req, res) {
			if (!req.body.title || !req.body.mainDescription) {
				res.status(400);
				res.json({message: 'bad request. A game should include a title, shortDescription, mainDescription and owner (id).'});
				return;
			}
			var game = new Game();
			game.title = req.body.title;
			game.mainDescription = req.body.mainDescription;
			game.owner = req.decoded.id;
			game.pieces.singles = 1;
			game.pieces.doubles = 1;
			game.pieces.triples = 1;
			game.numberOfPlayers = 1;

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
		});

	var parseSearchQuery = function (req, res, next) {
		var query = {};
		if (req.query.title) query.title = {'$regex': req.query.title, '$options': 'i'};
		if (req.query.singles) query['pieces.singles'] = {'$lte': req.query.singles};
		if (req.query.doubles) query['pieces.doubles'] = {'$lte': req.query.doubles};
		if (req.query.triples) query['pieces.triples'] = {'$lte': req.query.triples};
		if (req.query.numberOfPlayers) query.numberOfPlayers = {'$lte': req.query.numberOfPlayers};
		if (req.query.owner) query.owner = req.query.owner;
		if (req.query.search) query['$text'] = {$search: req.query.search};
		req.query = query;
		next();
	};

	var populateOwnerField = function (req, res, next) {
		if (!req.query) {
			req.query = {};
			next();
		}
		if (req.query.owner) {
			User.findOne({username: req.query.owner}, '-password -__v', function (err, user) {
				if (err) return res.status(500).json({message: 'internal server error'});
				if (user == null) return res.status(200).json({});
				else req.query.owner = user._id;
				next();
			});
		}
		else next();
	};

	router.route('/games').get(populateOwnerField, parseSearchQuery, function (req, res) {
		Game.find(req.query, '-__v', function (err, game) {
			if (err) res.status(500).json({mesage: err});
			else res.json(game);
		}).populate('owner', 'username');
	});

	router.route('/games/:game_id')
		.get(function (req, res) {
			Game.findById(req.params.game_id, function (err, game) {
				if (err) return res.send(err);
				if (game == null) return res.status(404).json({message: 'Game not found.'});
				else return res.json(game);
			}).populate('owner', 'username');
		})
		.put(decodeToken, function (req, res) {
			Game.findById({_id: req.params.game_id}, function (err, game) {
				if (err) return res.status(500).json({message: 'internal server error'});
				if (!game) return res.status(404).json({message: 'game with the specified id was not found'});
				if (req.body.title) game.title = req.body.title;
				if (req.body.mainDescription) game.mainDescription = req.body.mainDescription;
				game.save(function (err, game) {
					if (err) return res.status(500).json({message: 'internal server error'});
					game.populate('owner', 'username', function (err) {
						if (err) return res.status(500).json({message: 'internal server error'});
						return res.status(200).json(game);
					});
				});
			});
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
	router.route('/games/:game_id/ratings')
		.put(decodeToken, function (req, res) {
			if (!req.body.rating) {
				return res.status(400).json({message: 'Missing parameter rating.'});
			}
			if (req.body.rating > 5 || req.body.rating < 1) {
				return res.status(400).json({message: 'Invalid parameter value for rating (Minumum 1, maximum 5.'});
			}
			Game.findById(req.params.game_id, function (err, game) {
				if (err) {
					return res.status(500).json({message: 'Internal server error.'});
				}
				if (game === null) return res.status(404).json({message: 'Game not found.'});
				var newRating;
				var newVoteCount;
				Rating.findOne({_userId: req.decoded.id, _gameId: req.params.game_id}, function (err, rating) {
					if (err) return res.status(500).json({message: 'Internal server error.'});
					if (rating !== null) {
						if (rating.rating === req.params.rating) {
							res.status(409);
							res.json({message: 'Already rated with given value.'});
							return;
						}
						newRating = game.sumOfVotes;
						newRating -= rating.rating;
						newRating += req.body.rating;
						newVoteCount = game.numberOfVotes;
					}
					else {
						newRating = game.sumOfVotes + req.body.rating;
						newVoteCount = game.numberOfVotes;
						newVoteCount++;
					};
					Rating.findOneAndUpdate({_userId: req.decoded.id, _gameId: req.params.game_id}, {rating: req.body.rating}, {upsert: true}, function (err) {
						if (err) return res.status(500).json({message: 'Internal server error.'});
						Game.findOneAndUpdate({_id: req.params.game_id}, {numberOfVotes: newVoteCount, sumOfVotes: newRating}, {upsert: false}, function (err) {
							if (err) {
								return;
							}
							return res.status(201).json({message: 'Rating updated!'});
						});
					});
				});
			});
		});
	return router;
};
