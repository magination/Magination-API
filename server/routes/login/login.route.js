var express = require('express');
var router = express.Router();
var authenticate = require('./authenticate');
var signToken = require('./signToken');
var verifyToken = require('./verifyToken');
var verifyRefreshToken = require('./verifyRefreshToken');
var refreshToken = require('./refreshToken');
var async = require('async');
var constants = require('../../config/constants.config');
var crypto = require('crypto');
var User = require('../../models/user/user.model');
var userConfig = require('../../config/user.config');
var validator = require('validator');
var nodemailer = require('nodemailer');
var logger = require('../../logger/logger');
var globalBruteForce = require('../../bruteforce/bruteForce').globalBruteForce;
var userBruteForce = require('../../bruteforce/bruteForce').userBruteForce;
var emailconfig = require('../../config/email.config');
var serverConfig = require('../../config/server.config');
var emailTransport = require('../../email/smtpTransport');

module.exports = function (app) {
	router.post('/login', globalBruteForce.prevent,
						userBruteForce.getMiddleware({
							key: function (req, res, next) {
								next(req.body.username);
							}
						}), authenticate,
						signToken,
		function (req, res, next) {
			if (req.user && req.data) return res.status(200).json(req.data);
			else return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
		});

	router.get('/login/refresh', globalBruteForce.prevent, verifyRefreshToken, refreshToken, function (req, res) {
		if (req.data) return res.status(200).json(req.data);
		else return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
	});

	router.post('/login/forgot', globalBruteForce.prevent, userBruteForce.getMiddleware({
		key: function (req, res, next) {
			next(req.body.email);
		}
	}), function (req, res) {
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
				User.findOneAndUpdate({email: req.body.email},
				{resetPasswordToken: token, resetPasswordExpires: (Date.now() + userConfig.USER_TOKENS.RESET_PASSWORD_TOKEN_EXPIRATIONTIME)},
				{new: true},
				function (err, user) {
					if (err) {
						logger.log('error', 'POST /confirmation/:confirmEmailToken', err);
						return res.status(500).send();
					}
					else if (!user) return res.status(404).send();
					else done(err, token, user);
				});
			},
			function (token, user, done) {
				var smtpTransport = emailTransport;
				var mailOptions = {
					to: user.email,
					from: 'maginationtest@gmail.com',
					subject: 'Magination Game Site Reset Password',
					text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
					'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
					serverConfig.REMOTE_GAME_SITE + '/confirmforgotpassword/' + token + '\n\n' +
					'If you did not request this, please ignore this email and your password will remain unchanged.\n'
				};
				smtpTransport.sendMail(mailOptions);
				res.status(200).json({message: 'email has been sent'});
				req.brute.reset();
				done(null, 'done');
			}
		]);
	});

	router.post('/login/update/:emailToken', globalBruteForce.prevent, userBruteForce.getMiddleware({
		key: function (req, res, next) {
			next(req.body.email);
		}
	}), function (req, res) {
		User.findOne({updateEmailToken: req.params.emailToken, updateEmailExpires: { $gt: Date.now() }}, function (err, user) {
			if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			if (!user) return res.status(404).json({message: constants.httpResponseMessages.notFound});
			var newEmail = user.updateEmailTmp;
			User.findOneAndUpdate({updateEmailToken: req.params.emailToken, updateEmailExpires: { $gt: Date.now() }},
			{updateEmailToken: undefined, updateEmailExpires: undefined, updateEmailTmp: undefined, email: newEmail},
			function (err, user) {
				if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				if (!user) return res.status(404).json({message: constants.httpResponseMessages.notFound});
				else return res.status(200).json({message: constants.httpResponseMessages.success});
			});
		});
	});

	router.post('/login/forgot/:resetToken', globalBruteForce.prevent, function (req, res) {
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
