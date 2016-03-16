var express 		= require('express');
var passport 		= require('passport');
var app 			= express();
var bodyParser      = require('body-parser');
var mongoose 		= require('mongoose');
var PORT = 80;

mongoose.connect('mongodb://localhost/',function(){
		console.log("Successfully connected to MongoDB");
});


app.get('/', function(req, res){
	res.send('Welcome to the Magination API. Here is a list of the current API:');
});

app.listen(PORT, function(){
	console.log('Server listening at port:' + PORT);
});