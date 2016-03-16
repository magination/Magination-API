var express = require('express');
var path = require('path');
var baucis = require('baucis');
var router = express.Router();
var auth = require('./auth');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bodyParser      = require('body-parser');
var User = require('../../models/user/user.model');



module.exports = function(app){

  router.post('/login', auth, function(req, res, next) {
	    if (req.user) {
	    	//User successfully authenticated
	    	res.status(200);
	    	res.send({status: 200});
	    }    
  });

  return router;
};