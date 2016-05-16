var nodemailer = require('nodemailer');
var emailconfig = require('../config/email.config.js');

var mailer = nodemailer.createTransport(emailconfig.smtpConfig);
module.exports = mailer;
