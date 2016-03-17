var express = require('express');
var path = require('path');
var baucis = require('baucis');
var router = express.Router();
var gameRouter = require('./game/game.route');
var loginRouter = require('./login/login.route');
var userRouter = require('./user/user.route');

module.exports = function(app){

  
  router.get('/', function(req, res){
    res.send('Welcome to the Magination API. Here is a list of the current API:');
  });

  router.use("/", gameRouter());
  router.use('/', loginRouter());
  router.use('/', userRouter());

  return router;

};