var express = require('express');

var app = express();

app.get('/', function(req, res){
	res.send('Welcome to the Magination API. Here is a list of the current API:');
});

app.listen(8000, function(){
	console.log('Server listening at port 8000');
});