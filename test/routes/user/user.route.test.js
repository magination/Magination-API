var mongoose = require('mongoose');
var assert = require('assert');
var expect = require('chai').expect;  
var request = require('supertest');  
var serverconfig = require('../../../server/config/server.config');
var url = serverconfig.ADRESS + serverconfig.PORT;
var User = require('../../../server/models/user/user.model');

var user= {
	username: 'testUser',
	password: 'testPassword',
	email: 'test@someemail.com'
};

var faultyUser = {
	username: 'testUser',
	password: 'testPassword',
}

beforeEach(function(done){
	mongoose.connection.db.dropDatabase();  
    done();

});

afterEach(function(done){
    done();
});

it('POST /api/users - should create a user', function(done) {

	request(url)
	.post('/api/users')
	.send(user)
	.set('Accept', 'application/json')
	.expect(200)
	.end(function(err, res) {
          if (err) {
            throw err;
          }
          done();
    });
});


it('POST /api/users - should return 400: bad request with faulty json-object',function(done){
	request(url)
	.post('/api/users')
	.send(faultyUser)
	.set('Accept', 'application/json')
	.expect(400)
	.end(function(err, res) {
          if (err) {
            throw err;
          }
          done();
    });

});

it('GET /api/users/:id - should return 403: forbidden on request with no token',function(done){
	request(url)
	.get('/api/users/:id')
	.set('Accept', 'application/json')
	.expect(400)
	.end(function(err, res) {
          if (err) {
            throw err;
          }
          done();
    });

});



 



