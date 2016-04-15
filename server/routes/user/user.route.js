var express = require('express');
var router = express.Router();
var User = require('../../models/user/user.model');
var requestValidator = require('./user.request.validate');
var uniqueValidator = require('./user.unique.validate');
var validator = require('validator');
var decodeToken = require('../login/decodeToken');
var mongoose = require('mongoose');
var nev = require('email-verification')(mongoose);
var emailconfig = require('../../config/email.config');
var constants = require('../../config/constants.config');
/*
TODO: Split this component up. Nev should be configured in a seperate file.
 */
nev.configure({
	verificationURL: 'http://localhost:8080/confirmation/${URL}',
	persistentUserModel: User,
	tempUserCollection: 'magination_tempusers',

	transportOptions: {
		service: 'Gmail',
		auth: {
			user: emailconfig.EMAIL_ADRESS,
			pass: emailconfig.EMAIL_PASSWORD
		}
	},
	verifyMailOptions: {
		from: 'Do Not Reply <maginationtest@gmail.com>',
		subject: 'Please confirm account',
		html: 'Click the following link to confirm your account:</p><p>${URL}</p>',
		text: 'Please confirm your account by clicking the following link: ${URL}'
	}
});

nev.generateTempUserModel(User);

module.exports = function (app) {
	router.post('/users', requestValidator, uniqueValidator, function (req, res) {
		var newUser = new User({username: req.body.username, email: req.body.email, password: req.body.password});
		nev.createTempUser(newUser, function (err, newTempUser) {
			if (err) {
				if (err.name === 'ValidationError') {
					return res.status(409).json({message: constants.httpResponseMessages.conflict});
				}
				else {
					return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				}
			}
			if (newTempUser) {
				nev.registerTempUser(newTempUser, function (err) {
					if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
					return res.status(200).json({message: 'Success. A confirmation email has been sent.'});
				});
			}
			else {
				return res.status(409).json({message: constants.httpResponseMessages.conflict});
			}
		});
	});

	router.post('/confirmation/:id', function (req, res) {
		nev.confirmTempUser(req.params.id, function (err, user) {
			if (err) {
				return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
			}
			if (user) {
				return res.status(200).json(user);
			}
			else {
				return res.status(400).json({message: constants.httpResponseMessages.badRequest});
			}
		});
	});

	router.post('/resendVerificationEmail', function (req, res) {
		/*
		TODO: this is doomed to be missused. Should prevent multiple requests etc.
		 */
		if (!req.body.email || !validator.isEmail(req.body.email)) {
			return res.status(400).json({message: 'bad request'});
		}
		else {
			nev.resendVerificationEmail(req.body.email, function (err, emailSent) {
				if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				if (emailSent) return res.status(200).json({message: 'Verification email has been resent.'});
				else return res.status(404).json({message: constants.httpResponseMessages.notFound});
			});
		};
	});

	router.get('/users/:id/', decodeToken, function (req, res) {
		if (req.decoded.id === req.params.id) {
			User.findOne({_id: req.params.id}, '-password -__v', function (err, user) {
				if (err) return res.status(500).json({message: constants.httpResponseMessages.internalServerError});
				else if (user == null) {
					return res.status(404).json({message: constants.httpResponseMessages.notFound});
				}
				else return res.status(200).json(user);
			});
		}
		else {
			return res.status(403).json({message: constants.httpResponseMessages.forbidden});
		}
	});
	return router;
};
