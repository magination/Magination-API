var express = require('express');
var router = express.Router();
var User = require('../../models/user/user.model');
var registerValidate = require('./user.validate');
var decodeToken = require('../login/decodeToken');
var mongoose = require('mongoose'),
    nev = require('email-verification')(mongoose);


nev.configure({
    verificationURL: 'http://localhost:8080/confirmation/${URL}',
    persistentUserModel: User,
    tempUserCollection: 'magination_tempusers',
 
    transportOptions: {
        service: 'Gmail',
        auth: {
            user: 'maginationtest@gmail.com',
            pass: 'magination'
        }
    },
    verifyMailOptions: {
        from: 'Do Not Reply <maginationtest@gmail.com>',
        subject: 'Please confirm account',
        html: 'Click the following link to confirm your account:</p><p>${URL}</p>',
        text: 'Please confirm your account by clicking the following link: ${URL}'
    }
});

nev.generateTempUserModel(User);



module.exports = function(app){

	router.post('/users',registerValidate,function(req,res){

		var newUser = new User({username: req.body.username, email: req.body.email, password: req.body.password});
		nev.createTempUser(newUser, function(err, newTempUser) {
		    // some sort of error 
		    if (err)
		        if(err.name === 'ValidationError'){
					return res.status(409).json(err.errors);
				}else{
					return res.status(500).json({message: 'internal server error.'});
				}
		    // a new user 
		    if (newTempUser) {
		        nev.registerTempUser(newTempUser, function(err) {
		            if (err) console.log(err);
		            return res.status(200).json({message: 'Success! A confirmation email has been sent.'});
		        });
		 
		    } else {
		    	return res.status(409).json({message: 'The user allready exists. Please check your inbox for a confirmation mail.'});
		    }
		});


	});


	router.post('/confirmation/:id', function(req,res){
		nev.confirmTempUser(req.params.id, function(err, user) {
    		if (err){
        		return res.status(500).json({message: 'internal server error.'});
        	}	
		    if (user){
		        return res.status(200).json(user);
			}else{
				return res.status(400).json({message: 'bad request'});
			}
		     
		});
	});


	router.post('/resendVerificationEmail/:email',function(req,res){

		nev.resendVerificationEmail(req.params.email, function(err, emailSent) {
		    if (err)
		       return res.status(500).json({message: 'internal server error.'});  
		 
		    if (emailSent)
		        return res.status(200).json({message: 'verification email has been resent!'});
		    else
		        return res.stats(404).json({message: 'the email adress could not be found.'});
		});
	});

	router.get('/users/:id/',decodeToken, function(req,res){
		if(req.decoded.id == req.params.id){
			User.findOne({_id:req.params.id} ,'-password -__v', function(err, user){
				if(err) return res.status(500).json({message: 'internal server error.'});
				else if(user == null){
					return res.status(404).json({message: 'the user could not be found.'});
				}
				else return res.status(200).json(user);
			});
		}	
		else{
			return res.status(403).json({message: 'forbidden'});
		}
	});

	return router;
		
};