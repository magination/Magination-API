const jwt = require('jsonwebtoken');
var serverConfig = require('../../config/server.config');

module.exports = function(req, res,next){

	if(!req.header('Authorization')) return res.status(400).json({message: 'forbidden'});

	jwt.verify(req.header('Authorization'), serverConfig.SECRET,function(err,decoded){
		if(err){	
			
			return res.status(401).json({message: err.message});
		}
		else{
			req.decoded = decoded;
			next();
		}
	});		
	

};		