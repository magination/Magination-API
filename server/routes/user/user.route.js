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
var logger = require('../../logger/logger');
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
	var smtpTransport = nodemailer.createTransport('smtps://maginationtest%40gmail.com:magination@smtp.gmail.com');
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
		var newUser = new User({username: req.body.username.toLowerCase(), email: req.body.email.toLowerCase(), password: req.body.password, confirmEmailToken: req.body.confirmEmailToken, confirmEmailExpires: confirmEmailExpires});
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
				if (err) {
					logger.log('error', 'POST /confirmation/:confirmEmailToken', err);
					return res.status(500).send();
				}
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

	router.get('/users', function (req, res) {
		var query = {};
		if (!req.query.username && !req.query.email) return res.status(422).send();
		if (req.query.username) query.username = req.query.username;
		if (req.query.email) query.email = req.query.email;
		User.find(query, function (err, users) {
			if (err) {
				logger.log('error', 'GET /users', err);
				return res.satus(500).send();
			}
			else return res.status(200).json({users: users});
		}).select('username -_id');
	});

	router.get('/users/:id/', verifyToken, function (req, res) {
		if (req.verified.id !== req.params.id) return res.status(401).send();
		User.findOne({_id: req.params.id}, '-password -__v', function (err, user) {
			if (err) {
				logger.log('error', 'GET /users/:id', err);
				return res.status(500).send();
			}
			else if (user == null) {
				return res.status(404).send();
			}
			else return res.status(200).json(user);
		});
	});

	router.put('/users/:id/pieces', verifyToken, function (req, res) {
		if (req.verified.id !== req.params.id) return res.status(401).json({message: constants.httpResponseMessages.unauthorized});
		if (!req.body.pieces) return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		User.findByIdAndUpdate({_id: req.verified.id}, {pieces: req.body.pieces}, {new: true}, function (err, user) {
			if (err) {
				logger.log('error', 'PUT /users/:id/pieces', err);
				return res.status(500).send();
			}
			if (!user) return res.status(404).send();
			user.password = undefined;
			user.__v = undefined;
			return res.status(200).json(user);
		});
	});

	router.get('/users/:id/games', verifyToken, function (req, res) {
		if (req.verified.id !== req.params.id) return res.status(401).send();
		Game.find({owner: req.verified.id}, function (err, games) {
			if (err) {
				logger.log('error', 'GET /users/:id/games', err);
				return res.status(500).send();
			}
			return res.status(200).json(games);
		});
	});

	router.put('/users/:id', verifyToken, function (req, res) {
		if (req.verified.id !== req.params.id) return res.status(401).json({message: constants.httpResponseMessages.unauthorized});
		if (!req.body.email && !req.body.password || !req.body.oldPassword) return res.status(422).json({message: constants.httpResponseMessages.unprocessableEntity});
		User.findById({_id: req.verified.id}, function (err, user) {
			if (err) {
				logger.log('error', 'PUT /users/:id', err);
				return res.status(500).send();
			}
			if (!user) return res.status(404).send();
			user.validPassword(req.body.oldPassword)
				.then(function (result) {
					if (!result) return res.status(401).send();
					else {
						if (req.body.email) {
							if (!validator.isEmail(req.body.email)) return res.status(422).send();
							User.findOne({email: req.body.email}, function (err, user2) {
								if (err) {
									logger.log('error', 'PUT /users/:id', err);
									return res.status(500).send();
								}
								if (user2) return res.status(409).send();
								generateEmailUpdateTokenAndSendMail(req.body.email, user, req, res, function (err) {
									if (err) {
										logger.log('error', 'PUT /users/:id', err);
										return res.status(500).send();
									}
								});
							});
						}
						else {
							if (req.body.password) {
								if (req.body.password.length < userConfig.MIN_PASSWORD_LENGTH) {
									return res.status(422).send();
								}
								user.password = req.body.password;
							}
							else {
								user.password = req.body.oldPassword;
							}
							user.save(function (err) {
								if (err) {
									logger.log('error', 'PUT /users/:id', err);
									if (err.name === 'ValidationError') return res.status(409).json({message: 'Email already in use'});
									return res.status(500).send();
								}
								user.password = undefined;
								user.__v = undefined;
								return res.status(200).json(user);
							});
						}
					}
				}).catch(function (err) {
					if (err) {
						logger.log('error', 'PUT /users/:id', err);
						return res.status(500).send();
					}
				});
		});
	});

	var generateEmailUpdateTokenAndSendMail = function (newmail, user, req, res, next) {
		crypto.randomBytes(20, function (err, buf) {
			if (err) return next(err);
			var token = buf.toString('hex');
			User.findOne({_id: req.verified.id}, function (err, user) {
				if (err) {
					logger.log('error', 'generateEmailUpdateTokenAndSendMail() in user.route', err);
					return res.status(500).send();
				}
				if (!user) return res.status(404).send();
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
