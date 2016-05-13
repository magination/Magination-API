var express = require('express');
var router = express.Router();
var User = require('../../models/user/user.model');
var Game = require('../../models/game/game.model');
var requestValidator = require('./user.request.validate');
var uniqueValidator = require('./user.unique.validate');
var validator = require('validator');
var verifyToken = require('../login/verifyToken');
var mongoose = require('mongoose');
var nev = require('email-verification')(mongoose);
var emailconfig = require('../../config/email.config');
var serverConfig = require('../../config/server.config');
var userConfig = require('../../config/user.config');
var constants = require('../../config/constants.config');
var nodemailer = require('nodemailer');
var crypto = require('crypto');
var winston = require('winston');
var globalBruteForce = require('../../bruteforce/bruteForce').globalBruteForce;
var userBruteForce = require('../../bruteforce/bruteForce').userBruteForce;

var generateConfirmEmailToken = function (req, res, next) {
	crypto.randomBytes(20, function (err, buf) {
		if (err) return res.status(500).send();
		req.body.confirmEmailToken = buf.toString('hex');
		next();
	});
};

var sendConfirmationEmail = function (email, token) {
	var smtpTransport = nodemailer.createTransport('SMTP', {
		service: 'Gmail',
		auth: {
			user: emailconfig.EMAIL_ADRESS,
			pass: emailconfig.EMAIL_PASSWORD
		}
	});
	var url = serverConfig.REMOTE_GAME_SITE + '/confirmation/' + token;
	var mailOptions = {
		to: email,
		from: 'maginationtest@gmail.com',
		subject: 'Please confirm account',
		html: 'Click the following link to confirm your account:<p>' + url + '</p>',
		text: 'Please confirm your account by clicking the following link: ' + url
	};
	smtpTransport.sendMail(mailOptions);
};

module.exports = function (app) {
	router.post('/users', requestValidator, uniqueValidator, generateConfirmEmailToken, function (req, res) {
		var confirmEmailExpires = Date.now() + 3600000;
		var newUser = new User({username: req.body.username, email: req.body.email, password: req.body.password, confirmEmailToken: req.body.confirmEmailToken, confirmEmailExpires: confirmEmailExpires});
		newUser.save(function (err) {
			if (err) return res.status(500).send();
			sendConfirmationEmail(newUser.email, newUser.confirmEmailToken);
			return res.status(200).send();
		});
	});

	router.post('/confirmation/:confirmEmailToken', function (req, res) {
		User.findOneAndUpdate({confirmEmailToken: req.params.confirmEmailToken, confirmEmailExpires: {$gt: Date.now()}},
			{confirmEmailToken: undefined, confirmEmailExpires: undefined, isConfirmed: true},
			function (err, user) {
				if (err) return res.status(500).send();
				if (!user) return res.status(404).send();
				else return res.status(200).send();
			});
	});

	router.post('/resendVerificationEmail', globalBruteForce.prevent, userBruteForce.getMiddleware({
		key: function (req, res, next) {
			next(req.body.email);
		}
	}), function (req, res) {
		if (!req.body.email || !validator.isEmail(req.body.email)) {
			return res.status(400).json({message: 'bad request'});
		}
		else {
			User.findOne({email: req.body.email, confirmEmailExpires: {$gt: Date.now()}}, function (err, user) {
				if (err) return res.status(500).send();
				if (!user) return res.status(404).send();
				sendConfirmationEmail(user.email, user.confirmEmailToken);
				return res.status(200).send();
			});
		}
	});

	router.get('/users/:id/', verifyToken, function (req, res) {
		if (req.verified.id !== req.params.id) return res.status(401).json({message: constants.httpResponseMessages.unauthorized});
		User.findOne({_id: req.params.id}, '-password -__v', function (err, user) {
			if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			else if (user == null) {
				return res.status(404).json({message: constants.httpResponseMessages.notFound});
			}
			else return res.status(200).json(user);
		});
	});

	router.put('/users/:id/pieces', verifyToken, function (req, res) {
		if (req.verified.id !== req.params.id) return res.status(401).json({message: constants.httpResponseMessages.unauthorized});
		if (!req.body.pieces) return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		User.findByIdAndUpdate({_id: req.verified.id}, {pieces: req.body.pieces}, {new: true}, function (err, user) {
			if (err) {
				return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			}
			if (!user) return res.status(404).json({message: constants.httpResponseMessages.notFound});
			user.password = undefined;
			user.__v = undefined;
			return res.status(200).json(user);
		});
	});

	router.get('/users/:id/games', verifyToken, function (req, res) {
		if (req.verified.id !== req.params.id) return res.status(401).json({message: constants.httpResponseMessages.unauthorized});
		Game.find({owner: req.verified.id}, function (err, games) {
			if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			return res.status(200).json(games);
		});
	});

	router.put('/users/:id/', verifyToken, function (req, res) {
		if (req.verified.id !== req.params.id) return res.status(401).json({message: constants.httpResponseMessages.unauthorized});
		if (!req.body.email && !req.body.password || !req.body.oldPassword) return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		User.findById({_id: req.verified.id}, function (err, user) {
			if (err) {
				console.log(err);
				return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			}
			if (!user) return res.status(404).json({message: constants.httpResponseMessages.notFound});
			user.validPassword(req.body.oldPassword)
				.then(function (result) {
					if (!result) return res.status(401).json({message: constants.httpResponseMessages.unauthorized});
					else {
						if (req.body.email) {
							if (!validator.isEmail(req.body.email)) return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
							User.findOne({email: req.body.email}, function (err, user2) {
								if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
								if (user2) return res.status(409).json({message: 'Email allready in use.'});
								generateEmailUpdateTokenAndSendMail(req.body.email, user, req, res, function (err) {
									if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
								});
							});
						}
						else {
							if (req.body.password) {
								if (req.body.password.length < userConfig.MIN_PASSWORD_LENGTH) {
									return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
								}
								user.password = req.body.password;
							}
							else {
								user.password = req.body.oldPassword;
							}
							user.save(function (err) {
								if (err) {
									console.log(err);
									if (err.name === 'ValidationError') return res.status(409).json({message: 'Email already in use'});
									return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
								}
								user.password = undefined;
								user.__v = undefined;
								return res.status(200).json(user);
							});
						}
					}
				}).catch(function (err) {
					if (err) {
						console.log(err);
						return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
					}
				});
		});
	});

	var generateEmailUpdateTokenAndSendMail = function (newmail, user, req, res, next) {
		crypto.randomBytes(20, function (err, buf) {
			if (err) return next(err);
			var token = buf.toString('hex');
			User.findOne({_id: req.verified.id}, function (err, user) {
				if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				if (!user) return res.status(404).json({message: constants.httpResponseMessages.notFound});
				user.updateEmailTmp = newmail;
				user.updateEmailToken = token;
				user.updateEmailExpires = Date.now() + 3600000; // Update token valid for one hour
				user.password = req.body.oldPassword;
				user.save(function (err) {
					if (err) return next(err);
					var smtpTransport = nodemailer.createTransport('SMTP', {
						service: 'Gmail',
						auth: {
							user: emailconfig.EMAIL_ADRESS,
							pass: emailconfig.EMAIL_PASSWORD
						}
					});
					var mailOptions = {
						to: newmail,
						from: 'maginationtest@gmail.com',
						subject: 'Magination Game Site Update Mail',
						text: 'You are receiving this because you (or someone else) have requested updating the email for your account.\n\n' +
						'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
						serverConfig.REMOTE_GAME_SITE + '/verifyEmailChange/' + token + '\n\n' +
						'If you did not request this, please ignore this email.\n'
					};
					smtpTransport.sendMail(mailOptions);
					next();
				});
			});
		});
	};

	return router;
};
