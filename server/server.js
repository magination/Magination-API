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
var init 			= require('./init/init');
var path 			= require('path');

if (mongoose.connection.readyState === 0) {
	mongoose.connect(dbConfig.DATABASE.test, function (err) {
		if (err) console.log(err);
		else console.log('Successfully connected to: ' + dbConfig.DATABASE.test);
	});
};

//	app.use(helmet);

app.use(contentLength.validateMax({max: serverConfig.MAX_CONTENT_LENGTH_ACCEPTED, status: 400, message: 'Content Length is not accepted.'}));

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Origin, Authorization, X-Requested-With, Content-Type, Accept');
	next();
});
// Make public dir accessible
app.use('/public', express.static(path.join(__dirname, '../public')));

// HTTPS OPTIONS
var options = {
	key: fs.readFileSync('./server/https/key.pem'),
	cert: fs.readFileSync('./server/https/cert.pem')
};
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true, colorize: true}));

app.use(passport.initialize());
app.use('/api', router(app));

// Default error-handler. Errors should be handled before they get here.
app.use(function (err, req, res, next) {
	winston.log('error', 'Error caught in the default error-handler. This should probably not happen. Error: ' + err);
	return res.status(err.status || 500).json({error: err.message});
});

// WINSTON LOGGER INIT
winston.add(winston.transports.File, { filename: 'logs.log' });
winston.remove(winston.transports.Console);

// Init functions should be called here. This is now done after tests are run, move this before running in production.
// init.initFeaturedGames();

// CRONTAB JOBS
var cron2 = crontab.scheduleJob('*/2 * * * *', crontabjobs.removeExpiredResetPasswordTokens);
var cron3 = crontab.scheduleJob('*/2 * * * *', crontabjobs.removeExpiredUpdateEmailTokens);
var cron4 = crontab.scheduleJob('*/1 * * * *', crontabjobs.removeInvalidReports);

https.createServer(options, app).listen(serverConfig.PORT, function (err) {
	if (err) console.log(err);
	else console.log('Server listening at: ' + serverConfig.PORT);
});

