var express = require('express');
var router = express.Router();
var Review = require('../../models/review/review.model');
var Game = require('../../models/game/game.model');
var verifyToken = require('../login/verifyToken');
var validator = require('../../validator/validator');
var constants = require('../../config/constants.config');
var logger = require('../../logger/logger');
var User = require('../../models/user/user.model');
var winston = require('winston');
var Report = require('../../models/report/report.model');
var emailFunctions = require('../../email/emailFunctions');

module.exports = function (app) {
	router.get('/games/:gameId/reviews', function (req, res) {
		if (!validator.isValidId(req.params.gameId)) return res.status(422).send();
		if (req.query.userId) {
			Review.findOne({owner: req.query.userId, game: req.params.gameId}, function (err, review) {
				if (err) {
					logger.log('error', 'GET /games/:gameId/reviews', err);
					return res.status(500).send();
				}
				if (!review) return res.status(404).send();
				return res.status(200).json(review);
			}).populate('owner', 'username');
		} else {
			Game.findById({_id: req.params.gameId}, function (err, game) {
				if (err) {
					logger.log('error', 'GET /games/:gameId/reviews', err);
					return res.status(500).send();
				}
				if (!game) return res.status(404).send();
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
		if (!validator.isValidId(req.params.gameId) || !validator.isValidId(req.params.reviewId)) return res.status(422).send();
		Review.findOne({_id: req.params.reviewId}, function (err, review) {
			if (err) {
				logger.log('error', 'GET /games/:gameId/reviews/:reviewId', err);
				return res.status(500).send();
			}
			if (!review) return res.status(404).send();
			else return res.status(200).json(review);
		});
	});

	var verifyReviewRequest = function (req, res, next) {
		if (!req.body.reviewText || req.body.reviewText === '' || !req.body.rating || !validator.isValidId(req.params.gameId)) {
			return res.status(422).send();
		} else next();
	};

	router.post('/games/:gameId/reviews', verifyToken, verifyReviewRequest, function (req, res) {
		Review.findOne({owner: req.verified.id, game: req.params.gameId}, function (err, review) {
			if (err) {
				winston.log('error', err);
				return res.status(500).send();
			}
			if (review) return res.status(409).json({message: constants.httpResponseMessages.conflict});
			var newReview = new Review({game: req.params.gameId, owner: req.verified.id, reviewText: req.body.reviewText, rating: req.body.rating});
			newReview.save(function (err) {
				if (err) {
					return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				}
				Review.pushToGameAndAddRating(req.params.gameId, newReview);
				Review.populate(newReview, {path: 'owner', select: 'username'}, function (err, review) {
					if (err) {
						logger.log('error', 'POST /games/:gameId/reviews', err);
						return res.status(500).send();
					}
					return res.status(201).json(review);
				});
			});
		});
	});

	router.put('/games/:gameId/reviews/:reviewId', verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.gameId || !validator.isValidId(req.params.reviewId))) {
			return res.status(422).send();
		}
		Review.findOne({_id: req.params.reviewId, game: req.params.gameId, owner: req.verified.id}, function (err, review) {
			if (err) {
				logger.log('error', 'PUT /games/:gameId/reviews/:reviewId', err);
				return res.status(500).json.send();
			}
			if (!review) return res.status(404).json.send();
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
					logger.log('error', 'PUT /games/:gameId/reviews/:reviewId', err);
					return res.status(500).send();
				}
				if (newRating != null) Review.updateRatingInGame(req.params.gameId, oldRating, newRating);
				Review.populate(review, {path: 'owner', select: 'username'}, function (err, review) {
					if (err) {
						logger.log('error', 'PUT /games/:gameId/reviews/:reviewId', err);
						return res.status(500).send();
					}
					return res.status(200).json(review);
				});
			});
		});
	});

	router.get('/reviews/:reviewId', function (req, res) {
		if (!validator.isValidId(req.params.reviewId)) return res.status(404).send();
		Review.findById(req.params.reviewId, function (err, review) {
			if (err) {
				logger.log('error', 'GET /reviews/:reviewId', err);
				return res.status(500).send();
			}
			if (!review) return res.status(404).send();
			else return res.status(200).json(review);
		});
	});

	router.delete('/games/:gameId/reviews/:reviewId', verifyToken, function (req, res) {
		if (!validator.isValidId(req.params.gameId || !validator.isValidId(req.params.reviewId))) {
			return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		}
		Review.findOne({_id: req.params.reviewId, game: req.params.gameId}, function (err, review) {
			if (err) {
				logger.log('error', 'DELETE /games/:gameId/reviews/:reviewId', err);
				return res.status(500).send();
			}
			if (!review) return res.status(404).json({message: constants.httpResponseMessages.notFound});
			if (req.verified.privileges >= User.privileges.MODERATOR) {
				// The user doing the request is moderator or admin. If the review is not owned by the
				// user doing the request, a  mail is sent to the owner stating that the review has been removed.
				if (!review.owner.equals(req.verified.id)) {
					emailFunctions.sendEmailToUser(review.owner,
						'Your review has been removed.',
						'One of your reviews has been removed by a moderator. This is done if the review is flagged as spam, or contains foul language.');
				};
			} else {
				if (!review.owner.equals(req.verified.id)) return res.status(401).send();
			}
			Review.pullFromGameAndRemoveRating(req.params.gameId, review);
			Review.remove({_id: review._id}, function (err) {
				if (err) {
					logger.log('error', 'DELETE /games/:gameId/reviews/:reviewId', err);
					return res.status(500).send();
				}
				Report.removePossibleReports(review._id, Report.types.REVIEW); // if the review has been reported, the reports are deleted.
				return res.status(204).send();
			});
		});
	});
	return router;
};

