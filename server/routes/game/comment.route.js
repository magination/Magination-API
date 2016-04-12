var express = require('express');
var router = express.Router();
var Comment = require('../../models/comment/comment.model');
var Game = require('../../models/game/game.model');
var decodeToken = require('../login/decodeToken');

module.exports = function (app) {
	router.get('/games/:gameId/comments/', function (req, res) {
		Game.findById({_id: req.params.gameId}, function (err, game) {
			if (err) return res.status(500).json({message: 'internal server error'});
			if (!game) return res.status(404).json({message: 'game could not be found'});
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
			return res.status(400).json({message: 'bad request'});
		}
		else next();
	};

	var validateGameId = function (req, res, next) {
		Game.findById({_id: req.params.gameId}, function (err, game) {
			if (err) return res.status(500).json({message: 'internal server error'});
			if (!game) return res.status(404).json({message: 'game could not be found'});
			else next();
		});
	};

	router.delete('/games/:gameId/comments/:commentId', validateGameId, decodeToken, function (req, res) {
		Comment.remove({
			_id: req.params.commentId, owner: req.decoded.id
		}, function (err, comment) {
			if (!comment) return res.status(404).json({message: 'Comment with given id was not found'});
			if (err) return res.status(500).json({message: 'internal server error'});
			else res.status(200).json({_id: req.params.commentId});
		});
	});

	router.post('/games/:gameId/comments/', validateCommentRequest, validateGameId, decodeToken, function (req, res) {
		var newComment = new Comment({commentText: req.body.commentText, game: req.params.gameId, owner: req.decoded.id});
		newComment.save(function (err, comment) {
			if (err) return res.status(500).json({message: 'Internal server error.'});
			Comment.findById(comment._id, function (err, comment) {
				if (err || !comment) return res.status(500).json({message: 'internal server error'});
				else return res.status(201).json(comment);
			}).populate('owner', 'username');
		});
	});

	router.put('/games/:gameId/comments/:commentId', validateGameId, decodeToken, function (req, res) {
		Comment.findById({_id: req.params.commentId}, function (err, comment) {
			if (err) return res.status(500).json({message: 'internal server error'});
			var created = false;
			if (!comment) {
				comment = new Comment({game: req.params.gameId, owner: req.decoded.id});
				created = true;
			}
			comment.commentText = req.body.commentText;
			comment.save(function (err, comment) {
				if (err) return res.status(500).json({message: 'internal server error'});
				comment.populate('owner', 'username');
				if (created) return res.status(201).json(comment);
				else return res.status(200).json(comment);
			});
		});
	});
	return router;
};
