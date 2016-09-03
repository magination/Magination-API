var winston = require('winston');
/*
Generic logger to simplify logging with winston.
Level should be a winston log error: {error, warn, info, verbose, debug, silly}
Where: in what function did you encounter an error, optional.
toLog: the event to log.
 */
module.exports = {
	log: function (level, where, toLog) {
		if (level === 'error') {
			winston.log(level, 'An error occured in ' + where + '. The error: ' + toLog);
		} else if (!where) {
			winston.log(level, toLog);
		} else {
			winston.log(level, 'Logging from: ' + where + '. ' + toLog);
		}
	}
};
