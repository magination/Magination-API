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
var imageRoute = require('./image/image.route');

module.exports = function (app) {
	router.get('/', function (req, res) {
		res.send('Welcome to the Magination API!');
	});

	router.post('*', function (req, res, next) {
		// TODO: ADD POST-spam prevention here
		next();
	});
	router.use('/', gameRouter());
	router.use('/', loginRouter());
	router.use('/', userRouter());
	router.use('/', commentRouter());
	router.use('/', reviewRouter());
	router.use('/', unpublishedGameRouter());
	router.use('/', reportRouter());
	router.use('/', gameCreatorRoute());
	router.use('/', imageRoute());

	return router;
};
