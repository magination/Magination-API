var express = require('express');
var router = express.Router();
var Review = require('../../models/review/review.model');
var Game = require('../../models/game/game.model');
var verifyToken = require('../login/verifyToken');
var validator = require('../../validator/validator');
var constants = require('../../config/constants.config');
var winston = require('winston');

module.exports = function (app) {
	router.get('/games/:gameId/reviews', function (req, res) {
		if (!validator.isValidId(req.params.gameId)) return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		if (req.query.userId) {
			Review.findOne({owner: req.query.userId, game: req.params.gameId}, function (err, review) {
				if (err) {
					winston.log('error', err);
					return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				}
				if (!review) return res.status(404).json({message: constants.httpResponseMessages.notFound});
				return res.status(200).json(review);
			}).populate('owner', 'username');
		}
		else {
			Game.findById({_id: req.params.gameId}, function (err, game) {
				if (err) {
					winston.log('error', err);
					return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				}
				if (!game) return res.status(404).json({message: constants.httpResponseMessages.notFound});
				return res.status(200).json(game);
			}).select('reviews -_id').populate({
				path: 'reviews',
				populate: {
					path: 'owner',
					select: 'username'
				}
			});
		}
	});

	router.get('/games/:gameId/reviews/:reviewId', function (req, res) {
		if (!validator.isValidId(req.params.gameId) || !validator.isValidId(req.params.reviewId)) return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		Review.findOne({_id: req.params.reviewId}, function (err, review) {
			if (err) {
				winston.log('error', err);
				return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			}
			if (!review) return res.status(404).json({message: constants.httpResponseMessages.notFound});
			else return res.status(200).json(review);
		});
	});

	var verifyReviewRequest = function (req, res, next) {
		if (!req.body.reviewText || !req.body.rating || !validator.isValidId(req.params.gameId)) {
			return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		}
		else next();
	};

	router.post('/games/:gameId/reviews', verifyToken, verifyReviewRequest, function (req, res) {
		Review.findOne({owner: req.verified.id, game: req.params.gameId}, function (err, review) {
			if (err) {
				winston.log('error', err);
				return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			}
			if (review) return res.status(409).json({message: constants.httpResponseMessages.conflict});
			var newReview = new Review({game: req.params.gameId, owner: req.verified.id, reviewText: req.body.reviewText, rating: req.body.rating});
			newReview.save(function (err) {
				if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				Review.pushToGameAndAddRating(req.params.gameId, newReview);
				Review.populate(newReview, {path: 'owner', select: 'username'}, function (err, review) {
					if (err) {
						winston.log('error', err);
						return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
					}
					return res.status(201).json(review);
				});
			});
		});
	});

	router.put('/games/:gameId/reviews/:reviewId', verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.gameId || !validator.isValidId(req.params.reviewId))) {
			return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		}
		Review.findOne({_id: req.params.reviewId, game: req.params.gameId, owner: req.verified.id}, function (err, review) {
			if (err) {
				winston.log('error', err);
				return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			}
			if (!review) return res.status(404).json({message: constants.httpResponseMessages.notFound});
			var oldRating = review.rating;
			var newRating = null;
			if (req.body.reviewText) {
				review.reviewText = req.body.reviewText;
			}
			if (req.body.rating) {
				newRating = req.body.rating;
				review.rating = req.body.rating;
			}
			review.save(function (err) {
				if (err) {
					winston.log('error', err);
					return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				}				if (newRating != null) Review.updateRatingInGame(req.params.gameId, oldRating, newRating);
				Review.populate(review, {path: 'owner', select: 'username'}, function (err, review) {
					if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
					return res.status(200).json(review);
				});
			});
		});
	});

	router.delete('/reviews/:reviewId', verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.reviewId)) return res.status(404).send();
		Review.findById(req.params.reviewId, function (err, review) {
			if (err) return res.status(500).send();
			if (!review) return res.status(404).send();
			if (req.verified.privileges < 1) {
				if (req.verified.id !== review.owner) return res.status(401).send();
			}
			review.remove(function (err) {
				if (err) return res.status(500).send();
				else return res.status(204).send();
			});
		});
	});

	router.get('/reviews/:reviewId', function (req, res) {
		if (!validator.isValidId(req.params.reviewId)) return res.status(404).send();
		Review.findById(req.params.reviewId, function (err, review) {
			if (err) return res.status(500).send();
			if (!review) return res.status(404).send();
			else return res.status(200).json(review);
		});
	});

	router.delete('/games/:gameId/reviews/:reviewId', verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.gameId || !validator.isValidId(req.params.reviewId))) {
			return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		}
		Review.findOne({_id: req.params.reviewId, owner: req.verified.id, game: req.params.gameId}, function (err, review) {
			if (err) {
				winston.log('error', err);
				return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			}
			if (!review) return res.status(404).json({message: constants.httpResponseMessages.notFound});
			Review.pullFromGameAndRemoveRating(req.params.gameId, review);
			Review.remove({_id: review._id}, function (err) {
				if (err) {
					winston.log('error', err);
					return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				}
				return res.status(204).json({message: 'review has been deleted'});
			});
		});
	});
	return router;
};
