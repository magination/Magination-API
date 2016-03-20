const jwt = require('jsonwebtoken');
var serverConfig = require('../../config/server.config');

module.exports = function(req, res,next){
	var decoded = jwt.verify(req.body.token.hash, serverConfig.SECRET);
	console.log(decoded);
	req.decoded = decoded;
	next();

};