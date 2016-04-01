const jwt = require('jsonwebtoken');
var serverConfig = require('../../config/server.config');

module.exports = function(req, res,next){
	jwt.verify(req.header('Authorization'), serverConfig.SECRET,function(err,decoded){
		if(err){	
			return res.status(401).json({message: 'Token not valid.'})
		}
		else{
			req.decoded = decoded;
			next()
		}
	});
	

};	