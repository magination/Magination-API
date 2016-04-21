var express = require('express');
var router = express.Router();
var authenticate = require('./authenticate');
var signToken = require('./signToken');
var verifyToken = require('./verifyToken');
var refreshToken = require('./refreshToken');
var async = require('async');
var constants = require('../../config/constants.config');
var crypto = require('crypto');
var User = require('../../models/user/user.model');
var validator = require('validator');
var nodemailer = require('nodemailer');
var emailconfig = require('../../config/email.config');

module.exports = function (app) {
	router.post('/login', authenticate, signToken, function (req, res, next) {
		if (req.user && req.data) return res.status(200).json(req.data);
		else return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
	});

	router.get('/login/refresh', verifyToken, refreshToken, function (req, res) {
		if (req.data) return res.status(200).json(req.data);
		else return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
	});

	router.post('/login/forgot', function (req, res) {
		if (!req.body.email) return res.status(422);
		if (!validator.isEmail(req.body.email)) return res.status(422);
		async.waterfall([
			function (done) {
				crypto.randomBytes(20, function (err, buf) {
					var token = buf.toString('hex');
					done(err, token);
				});
			},
			function (token, done) {
				User.findOne({email: req.body.email}, function (err, user) {
					if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
					if (!user) return res.status(404).json({message: constants.httpResponseMessages.notFound});
					user.resetPasswordToken = token;
					user.resetPasswordExpires = Date.now() + 3600000; // Reset token valid for one hour
					user.save(function (err) {
						done(err, token, user);
					});
				});
			},
			function (token, user, done) {
				var smtpTransport = nodemailer.createTransport('SMTP', {
					service: 'Gmail',
					auth: {
						user: emailconfig.EMAIL_ADRESS,
						pass: emailconfig.EMAIL_PASSWORD
					}
				});
				var mailOptions = {
					to: user.email,
					from: 'maginationtest@gmail.com',
					subject: 'Magination Game Site Reset Password',
					text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
					'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
					'http://localhost:8080' + '/confirmforgotpassword/' + token + '\n\n' +
					'If you did not request this, please ignore this email and your password will remain unchanged.\n'
				};
				smtpTransport.sendMail(mailOptions, function (err) {
					if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
					res.status(200).json({message: 'email has been sent'});
					done(err, 'done');
				});
			}
		]);
	});

	router.post('/login/forgot/:resetToken', function (req, res) {
		if (!req.body.password || !req.params.resetToken) return res.status(422);
		User.findOne({resetPasswordToken: req.params.resetToken, resetPasswordExpires: { $gt: Date.now() }}, function (err, user) {
			if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			if (!user) return res.status(404).json({message: constants.httpResponseMessages.notFound});
			user.password = req.body.password;
			user.resetPasswordToken = undefined;
			user.resetPasswordExpires = undefined;
			user.save(function (err) {
				if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				else return res.status(200).json({message: constants.httpResponseMessages.ok});
			});
		});
	});

	return router;
};
