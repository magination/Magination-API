var mongoose = require('mongoose');
var Game = require('../../../server/models/game/game.model');
var User = require('../../../server/models/user/user.model');

var assert = require('assert');

  var currentGame = null; 

	beforeEach(function(done){    
	    //add some test data
	    Game.remove({});
	    var newUser = new User({username: 'testUser', email: 'test@test.test', password: 'test'});
	    newUser.save();
	    var newGame = new Game({title: 'testTitle', shortDescription: 'this is a short description', mainDescription: 'this is the maindescription', owner: newUser._id });
		newGame.save();
		currentGame = newGame;
		done();
    });

	afterEach(function(done){
		Game.remove({});
		done();
	});

	it('saves a game',function(done){
		Game.find({},function(err, doc) {
	  		assert.notEqual(doc,false);
	  		done();
	  	});                
	});
	
	it('finds a game by id',function(done){
		Game.find({_id: currentGame._id},function(err, doc) {
			assert.notEqual(doc,false);
			done();
	  	});                
	});
