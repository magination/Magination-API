var express = require('express');
var router = express.Router();
var User = require('../../models/user/user.model');
var registerValidate = require('./user.validate');

module.exports = function(app){

	router.post('/users',registerValidate,function(req,res){
		var user = new User({username: req.body.username, email: req.body.email, password: req.body.password});
		user.save(function(err){
			if(err){
				if(err.name === 'ValidationError'){
					res.status(409);
					res.json(err.errors);
				}else{
					res.status(500);
					res.json({message: 'something went wrong :('});
				}

			}else{
				res.status(200);
				res.json(user);
			}
		});
	});

	router.get('/users/:username', function(req,res){
		/*TODO auth*/
		User.findOne({username:req.params.username}, function(err, user){
			if(err) throw err; /*TODO handle instead of throw*/
			res.status(200).json(user);
		});
	});

	return router;
		
};