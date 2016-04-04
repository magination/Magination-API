
var validator = require('validator');
var User = require('../../models/user/user.model');

module.exports = function(req,res,next){

	/*
	TODO: This whole section needs a rewrite. This is not very efficient.
	 */
	
	User.findOne({ username: req.body.username }, function (err, user) {
		if(err) return res.status(500).json({message: "internal server error"});
		else if(user) return res.status(409).json({message: 'username allready exists'});

		User.findOne({ email: req.body.email }, function (err, user) {
			if(err) return res.status(500).json({message: "internal server error"});
			else if(user) return res.status(409).json({message: 'email allready exists'});
			next();
	     });
    
     });
};
	