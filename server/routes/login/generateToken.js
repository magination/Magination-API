const jwt = require('jsonwebtoken');
var serverConfig = require('../../config/server.config');

module.exports = function(req, res,next){
	var hash = jwt.sign(
	  	{
	  		id: req.user.id,
	  		username: req.user.username,
	  		password: req.user.password,
	  		expiresIn: 60*60*12
		}
		,serverConfig.SECRET);

	var token = {
		username: req.user.username,
		id: req.user.id,
		hash: hash
	};
	req.token = token;
	next();
};