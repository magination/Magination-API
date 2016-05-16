var User = require('../models/user/user.model');
var logger = require('../logger/logger');
var emailTransport = require('./smtpTransport');

var functions = {
	sendEmailToUser: function (userId, subject, message) {
		/*
		Function that finds a user by id, sends a mail with the message to the email-adress in the user-object.
		 */
		User.findById(userId, function (err, user) {
			if (err) {
				logger.log('error', 'sendEmailToUser() in emailFunctions', err);
				return;
			}
			if (!user) {
				logger.log('info', 'sendEmailToUser() in emailFunctions', 'Tried to send an email to a user that does not exist.');
				return;
			}
			var smtpTransport = emailTransport;
			var mailOptions = {
				to: user.email,
				from: 'maginationtest@gmail.com',
				subject: subject,
				html: message,
				text: message
			};
			smtpTransport.sendMail(mailOptions);
		});
	}
};

module.exports = functions;
