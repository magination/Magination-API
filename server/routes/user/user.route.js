var express = require('express');
var router = express.Router();
var User = require('../../models/user/user.model');
var registerValidate = require('./user.validate');
var mongoose = require('mongoose'),
    nev = require('email-verification')(mongoose);


nev.configure({
    verificationURL: 'http://localhost.com/confirmation/${URL}',
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
					res.status(409);
					res.json(err.errors);
				}else{
					res.status(500);
					res.json({message: 'internal server error.'});
				}
		    // a new user 
		    if (newTempUser) {
		        nev.registerTempUser(newTempUser, function(err) {
		            if (err) console.log(err);
		            console.log("user created");
		            return res.status(200).json({message: 'Success! A confirmation email has been sent.'});
		        });
		 
		    } else {
		    	console.log("user allready exists..");
		    	return res.status(409).json({message: 'The user allready exists. Please check your inbox for a confirmation mail.'});
		    }
		});


	});


	router.post('/users/confirmation/:id', function(req,res){
		console.log(req.params.id);
		nev.confirmTempUser(req.params.id, function(err, user) {
    		if (err){
        	// handle error... 
        		console.log('error: ' + err);
        		return res.status(500).json({message: 'internal server error.'});
        	}	
 			
		    if (user){
		        //all good
		        return res.status(200).json(user);
			}else{
				//TODO: Find appropriate error message and code. When will this happen?
				return res.status(500).json({message: 'internal server error.'});

			}
		     
		});
	});

	return router;
		
};