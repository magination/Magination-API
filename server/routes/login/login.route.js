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

  
  router.post('/login', auth, function(req, res,next){
  		if(req.user){
  			res.status(200); 
  			res.send({status: 200}); 		}
  });


  router.get('/init',function(req,res){
  	var tore = new User({
  		username: 'tore',
  		email: 'tore@tore.no',
  		password: 'tore'
  	});
  	tore.save(function(){
  		console.log('tore has been saved.');
  	});
  	res.send('lel');
  });

  router.get('/login',function(req,res){
  	res.status(200);
  	res.send('/login get');
  });

  return router;
};