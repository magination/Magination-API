var express 		= require('express');
var passport 		= require('passport');
var app 			= express();
var bodyParser      = require('body-parser');
var mongoose 		= require('mongoose');
var PORT 			= 80; //todo: put in config, same with mongodb link
var router 			= require('./routes');
var dbConfig 		= require('./config/db.config');
var serverConfig 	= require('./config/server.config');


mongoose.connect(dbConfig.DATABASE,function(){
		console.log('Successfully connected to: ' + dbConfig.DATABASE);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/',router(app));

app.listen(serverConfig.PORT, function(){
	console.log('Server listening at port:' + serverConfig.PORT);
});