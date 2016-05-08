var express = require('express');
var router = express.Router();
var gameRouter = require('./game/game.route');
var loginRouter = require('./login/login.route');
var userRouter = require('./user/user.route');
var commentRouter = require('./game/comment.route');
var reviewRouter = require('./game/review.route');
var unpublishedGameRouter = require('./game/unpublishedGame.route');
var reportRouter = require('./report/report.route');
var gameCreatorRoute = require('./gameCreator/gameCreator.route');

module.exports = function (app) {
	router.get('/', function (req, res) {
		res.send('Welcome to the Magination API!');
	});

	router.use('/', gameRouter());
	router.use('/', loginRouter());
	router.use('/', userRouter());
	router.use('/', commentRouter());
	router.use('/', reviewRouter());
	router.use('/', unpublishedGameRouter());
	router.use('/', reportRouter());
	router.use('/', gameCreatorRoute());
	return router;
};
