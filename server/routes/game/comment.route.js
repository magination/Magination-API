var express = require('express');
var router = express.Router();
var Comment = require('../../models/comment/comment.model');
var Game = require('../../models/game/game.model');
var decodeToken = require('../login/decodeToken');
var constants = require('../../config/constants.config');

module.exports = function (app) {
	router.get('/games/:gameId/comments/', function (req, res) {
		Game.findById({_id: req.params.gameId}, function (err, game) {
			if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			if (!game) return res.status(404).json({message: constants.httpResponseMessages.notFound});
			else return res.status(200).json(game);
		}).select('comments -_id').populate({
			path: 'comments',
			populate: {
				path: 'owner',
				select: 'username'
			}
		});
	});

	var validateCommentRequest = function (req, res, next) {
		if (!req.body.commentText) {
			return res.status(400).json({message: constants.httpResponseMessages.badRequest});
		}
		else next();
	};

	var validateGameId = function (req, res, next) {
		Game.findById({_id: req.params.gameId}, function (err, game) {
			if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			if (!game) return res.status(404).json({message: constants.httpResponseMessages.notFound});
			else next();
		});
	};

	router.delete('/games/:gameId/comments/:commentId', validateGameId, decodeToken, function (req, res) {
		Comment.remove({
			_id: req.params.commentId, owner: req.decoded.id
		}, function (err, comment) {
			if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			if (!comment) return res.status(404).json({message: constants.httpResponseMessages.notFound});
			comment.pullFromGame(comment.game);
			res.status(200).json({_id: req.params.commentId});
		});
	});

	router.post('/games/:gameId/comments/', validateCommentRequest, validateGameId, decodeToken, function (req, res) {
		var newComment = new Comment({commentText: req.body.commentText, game: req.params.gameId, owner: req.decoded.id});
		newComment.save(function (err, comment) {
			if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			comment.pushToGame(req.params.gameId);
			Comment.findById(comment._id, function (err, comment) {
				if (err || !comment) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				else return res.status(201).json(comment);
			}).populate('owner', 'username');
		});
	});

	router.put('/games/:gameId/comments/:commentId', validateGameId, decodeToken, function (req, res) {
		Comment.findById({_id: req.params.commentId}, function (err, comment) {
			if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			if (!comment) return res.status(404).json({message: constants.httpResponseMessages.notFound});
			comment.commentText = req.body.commentText;
			comment.save(function (err, comment) {
				if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				comment.populate('owner', 'username', function (err) {
					if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
					return res.status(200).json(comment);
				});
			});
		});
	});

	router.get('/comments/:commentId', function (req, res) {
		Comment.findById({_id: req.params.commentId}, function (err, comment) {
			if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			if (!comment) return res.status(404).json({message: constants.httpResponseMessages.notFound});
			else return res.status(200).json(comment);
		}).select('childComments -_id').populate({
			path: 'childComments',
			populate: {
				path: 'owner',
				select: 'username'
			}
		});
	});

	router.post('/comments/:commentId', decodeToken, validateCommentRequest, function (req, res) {
		Comment.findOne({_id: req.params.commentId}, function (err, comment) {
			if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			if (!comment) return res.status(404).json({message: constants.httpResponseMessages.notFound});
			var childComment = new Comment({owner: req.decoded.id, game: comment.game, commentText: req.body.commentText});
			childComment.save(function (err) {
				if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				comment.childComments.push(childComment._id);
				comment.save(function (err) {
					if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
					childComment.populate('owner', 'username', function (err) {
						if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
						else return res.status(201).json(childComment);
					});
				});
			});
		});
	});

	return router;
};
