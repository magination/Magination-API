require('dotenv').config();

var express 		= require('express');
var passport 		= require('passport');
var app 			= express();
var bodyParser 		= require('body-parser');
var mongoose 		= require('mongoose');
var router 			= require('./routes');
var dbConfig 		= require('./config/db.config');
var serverConfig 	= require('./config/server.config');
var https 			= require('https');
var fs 				= require('fs');
var helmet 			= require('helmet');
var contentLength 	= require('express-content-length-validator');
var crontab 		= require('node-crontab');
var crontabjobs 	= require('./cronjobs/cronjobs');
var winston 		= require('winston');
var path 			= require('path');

if (process.env.NODE_ENV === 'production') {
	mongoose.connect(dbConfig.DATABASE.production);
} else {
	mongoose.connect(dbConfig.DATABASE.test);
}

app.use(helmet());

app.use(contentLength.validateMax({max: serverConfig.MAX_CONTENT_LENGTH_ACCEPTED, status: 400, message: 'Content Length is not accepted.'}));

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Origin, Authorization, X-Requested-With, Content-Type, Accept');
	next();
});
// Make public dir accessible
app.use('/public', express.static(path.join(__dirname, '../public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true, colorize: true}));

app.use(passport.initialize());
app.use('/api', router(app));

// Default error-handler. Errors should be handled before they get here.
app.use(function (err, req, res, next) {
	winston.log('error', 'Error caught in the default error-handler. This should probably not happen. Error: ' + err);
	if (res.headersSent) return;
	return res.status(err.status || 500).send();
});

// WINSTON LOGGER INIT
winston.add(winston.transports.File, { filename: 'logs.log' });
winston.remove(winston.transports.Console);

// CRONTAB JOBS                  M  H  D
crontab.scheduleJob('0 */3 * * *', crontabjobs.removeExpiredConfirmEmailUsers);
crontab.scheduleJob('0 */3 * * *', crontabjobs.removeExpiredResetPasswordTokens);
crontab.scheduleJob('0 */3 * * *', crontabjobs.removeExpiredUpdateEmailTokens);

app.listen(serverConfig.PORT, function () {
	console.log('Listening top port', serverConfig.PORT);
});
