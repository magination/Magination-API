var winston = require('winston');
var ExpressBrute = require('express-brute');
var MongoStore = require('express-brute-mongo');
var MongoClient = require('mongodb').MongoClient;

var store = new MongoStore(function (ready) {
	MongoClient.connect('mongodb://127.0.0.1:27017/test', function (err, db) {
		if (err) throw err;
		ready(db.collection('bruteforce-store'));
	});
});

var failCallback = function (req, res, next, nextValidRequestDate) {
	return res.status(429).send('You have made too many failed attempts in a short period of time, please try again at ' + nextValidRequestDate);
};

var handleStoreError = function (error) {
	winston.log('error', error);
};

module.exports = {
	userBruteForce: new ExpressBrute(store, {
		freeRetries: 5,
		proxyDepth: 1,
		minWait: 5 * 60 * 1000, // 5 minutes
		maxWait: 60 * 60 * 1000, // 1 hour
		failCallback: failCallback,
		handleStoreError: handleStoreError
	}),

	globalBruteForce: new ExpressBrute(store, {
		freeRetries: 1000,
		proxyDepth: 1,
		attachResetToRequest: false,
		refreshTimeoutOnRequest: false,
		minWait: 25 * 60 * 60 * 1000, // 1 day 1 hour (should never reach this wait time)
		maxWait: 25 * 60 * 60 * 1000, // 1 day 1 hour (should never reach this wait time)
		lifetime: 24 * 60 * 60, // 1 day (seconds not milliseconds)
		failCallback: failCallback,
		handleStoreError: handleStoreError
	})
};
