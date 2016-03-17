var express = require('express');
var router = express.Router();
var User = require('../../models/user/user.model');
var registerValidate = require('./register.validate');

module.exports = function(app){

	router.post('/register',registerValidate,function(req,res){
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

	return router;
		
};