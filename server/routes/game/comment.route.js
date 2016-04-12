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
			select: 'username',
			populate: {
				path: '_userId'
			}
		});
	});

	var validateCommentRequest = function (req, res, next) {
		console.log(req.body.commentText);
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
			_id: req.params.commentId, _userId: req.decoded.id
		}, function (err, comment) {
			if (!comment) return res.status(404).json({message: 'Comment with given id was not found'});
			if (err) return res.status(500).json({message: 'internal server error'});
			else res.json({message: 'Successfully deleted comment'});
		});
	});

	router.post('/games/:gameId/comments/', validateCommentRequest, validateGameId, decodeToken, function (req, res) {
		var newComment = new Comment({commentText: req.body.commentText, _gameId: req.params.gameId, _userId: req.decoded.id});
		newComment.save(function (err, comment) {
			if (err) return res.status(500).json({message: 'Internal server error.'});
			else return res.status(201).json(comment);
		});
	});
	return router;
};
