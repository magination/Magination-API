var express = require('express');
var router = express.Router();
var gameRouter = require('./game/game.route');
var loginRouter = require('./login/login.route');
var userRouter = require('./user/user.route');
var reviewRouter = require('./game/review.route');
var unpublishedGameRouter = require('./game/unpublishedGame.route');
var reportRouter = require('./report/report.route');
var gameCreatorRoute = require('./gameCreator/gameCreator.route');
var imageRoute = require('./image/image.route');
var fs = require('fs');
var moderatorRoute = require('./user/moderator.route');

module.exports = function (app) {
	router.get('/', function (req, res) {
		res.redirect('/public/magination-api-reference.pdf');
	});

	router.use('/', gameRouter());
	router.use('/', loginRouter());
	router.use('/', moderatorRoute());
	router.use('/', userRouter());
	router.use('/', reviewRouter());
	router.use('/', unpublishedGameRouter());
	router.use('/', reportRouter());
	router.use('/', gameCreatorRoute());
	router.use('/', imageRoute());

	return router;
};
