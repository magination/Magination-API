var express = require('express');
var path = require('path');
var baucis = require('baucis');
var router = express.Router();
var authenticate = require('./authenticate');
var generateToken = require('./generateToken');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bodyParser      = require('body-parser');
var User = require('../../models/user/user.model');



module.exports = function(app){

  router.post('/login', authenticate, generateToken, function(req, res, next) {
	    if (req.user && req.token) {
	    	//User authenticated and token generated
	    	res.status(200).json({
	    		id: req.user.id,
	    		username: req.user.username,
	    		token: req.token
	    	});
	    } 
	    else{
	    	//This should never happen
	    	res.status(500).json({message: 'something went wrong :('});
	    }   
  });
  
  return router;
};