const jwt = require('jsonwebtoken');
var serverConfig = require('../../config/server.config');




module.exports = function(req, res,next){

	console.log('username: ' + req.user.username);
	console.log('password: ' + req.user.password);
	console.log(req.user);

	var token = jwt.sign(
	  	{
	  		id: req.user.id,
	  		username: req.user.username,
	  		expiresIn: 60*60*12
		}
		,serverConfig.SECRET);

	req.token = token;
	next();
};