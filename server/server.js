var express 		= require('express');
var passport 		= require('passport');
var app 			= express();
var bodyParser 		= require('body-parser');
var mongoose 		= require('mongoose');
var router 			= require('./routes');
var dbConfig 		= require('./config/db.config');
var serverConfig 	= require('./config/server.config');
var https 			= require('https');
var fs = require('fs');

if (mongoose.connection.readyState === 0) {
	mongoose.connect(dbConfig.DATABASE.test, function (err) {
		if (err) console.log(err);
		else console.log('Successfully connected to: ' + dbConfig.DATABASE.test);
	});
};

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Origin, Authorization, X-Requested-With, Content-Type, Accept');
	next();
});

var options = {
	key: fs.readFileSync('./server/https/key.pem'),
	cert: fs.readFileSync('./server/https/cert.pem')
};
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(passport.initialize());
app.use('/api', router(app));

https.createServer(options, app).listen(serverConfig.PORT, function (err) {
	if (err) console.log(err);
	else console.log('Server listening at: ' + serverConfig.PORT);
});

