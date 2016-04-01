const jwt = require('jsonwebtoken');
var serverConfig = require('../../config/server.config');

module.exports = function(req, res,next){
	var hash = jwt.sign(
	  	{
	  		id: req.user.id,
	  		username: req.user.username,
	  		email: req.user.email,
	  		password: req.user.password,
	  		expiresIn: 60*60*12
		}
		,serverConfig.SECRET);

	console.log('hash: ' + hash);
	var data = {
		token: hash,
		id: req.user.id,
		expiresIn: 60*60*12,
	};

	req.data = data;

	next();
};