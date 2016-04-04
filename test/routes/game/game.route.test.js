var mongoose = require('mongoose');
var assert = require('assert');
var expect = require('chai').expect;  
var request = require('supertest');  
var serverconfig = require('../../../server/config/server.config');
var url = serverconfig.ADRESS + serverconfig.PORT;
var Game = require('../../../server/models/game/game.model');

beforeEach(function(done){
	mongoose.connection.db.dropDatabase();  
    done();

});

afterEach(function(done){
    done();
});

it('GET /api/games - should return availiable games', function(done) {

	request(url)
	.get('/api/games')
	.set('Accept', 'application/json')
	.expect(200)
	.end(function(err, res) {
          if (err) {
            throw err;
          }
          done();
    });
});









 



