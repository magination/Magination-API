var mongoose = require('mongoose');
var assert = require('assert');
var expect = require('chai').expect;  
var request = require('supertest');  
var serverconfig = require('../../../server/config/server.config');
var url = serverconfig.ADRESS + serverconfig.PORT;
var User = require('../../../server/models/user/user.model');
var currentUser = null;

beforeEach(function(done){
	mongoose.connection.db.dropDatabase();  
    done();
});


it('POST /api/login - should return 400 when json-object is faulty', function(done) {

	request(url)
	.post('/api/login')
	.set('Accept', 'application/json')
	.expect(400)	
	.end(function(err, res) {
          if (err) {
            throw err;
          }
          done();
    });
});


it('POST /api/login - should return 401 when json-object with invalid credentials is sent', function(done) {

	request(url)
	.post('/api/login')
	.set('Accept', 'application/json')
	.send({username: 'user', password: 'password'})
	.expect(401)	
	.end(function(err, res) {
          if (err) {
            throw err;
          }
          done();
    });
});


