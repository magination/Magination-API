var mongoose = require('mongoose');
var User = require('../../../server/models/user/user.model');
var assert = require('assert');




  var currentUser = null; 

	beforeEach(function(done){

	    mongoose.connection.db.dropDatabase();
	    var newUser = new User({username: 'testUser', email: 'test@test.com', password: 'test'});
	    currentUser = newUser;
		newUser.save(function(err){
			if(err) throw err;
			done();
		});
		
    });

	afterEach(function(done){
		done();
	});

	it('saves a user',function(done){
		User.find({},function(err, doc) {
	  		assert.notEqual(doc,false);
	  		done();
	  	});                
	});

	
	
	it('finds a user by username',function(done){
		User.find({username: 'testUser'},function(err, doc) {
			assert.notEqual(doc,false);
			done();
	  	});                
	});

	
	it('finds a user by email',function(done){
		User.find({email: 'test@test.com'},function(err, doc) {
		  	assert.notEqual(doc,false);
		  	done();
		  });                
	});	


 



