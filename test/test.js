var assert = require('assert');
var request = require('request');
var serverConfig = require('../server/config/server.config');
var host = serverConfig.ADRESS + serverConfig.PORT;


/* TODO: This whole section needs to be redone. 

describe('/user',function(){
	describe('post call with incomplete json object',function(){
		it('should return error-status 400',function(){
			request.post(host + '/users').on('response',function(respone){
				assert.equal(400,response.statusCode);
			});
		});
	});
});	

describe('/api',function(){
	describe('get call ',function(){
		it('should return success status 200',function(){
			request.get(host+ '/api').on('response',function(respone){
				assert.equal(200,response.statusCode);
			});
		});
	});
});	


describe('/login',function(){
	describe('post call with incomplete json object ',function(){
		it('should return error-status 400 ',function(){
			request.post(host+ '/api/login').on('response',function(respone){
				assert.equal(400,response.statusCode);
			});
		});
	});
});	

	
*/





