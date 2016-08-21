var nodemailer = require('nodemailer');
var emailconfig = require('../config/email.config.js');

var mailer = nodemailer.createTransport(emailconfig.smtpConfig);

mailer.verify(function(error, success) {
   if (error) {
        console.log(error);
   } else {
        console.log('Server is ready to take our messages');
   }
});

module.exports = mailer;

