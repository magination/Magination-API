var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../../models/user/user.model');
var validator = require('validator');
var constants = require('../../config/constants.config');

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});

passport.use('username', new LocalStrategy(
	{
		session: false
	},
	function (username, password, done) {
		User.findOne({ username: username }, function (err, user) {
			if (err) { return done(err); }
			if (!user) return done('Incorrect username');
			user.validPassword(password)
			.then(function (result) {
				if (result) return done(null, user);
				else done('Incorrect password');
			}).catch(function (err) {
				return done(err, null);
			});
		});
	}
));

passport.use('email', new LocalStrategy(
	{
		session: false
	},
	function (username, password, done) {
		User.findOne({ email: username }, function (err, user) {
			if (err) return done(err);
			if (!user) return done('Incorrect email');
			user.validPassword(password)
			.then(function (result) {
				if (result) return done(null, user);
				else done('Incorrect password');
			}).catch(function (err) {
				return done(err, null);
			});
		});
	}
));

module.exports = function (req, res, next) {
	/*
		A user can authenticate with both email and username.
		The body-field named username can contain both email and a username,
		this explains this somewhat weird setup.
	 */
	if (!req.body.password || !req.body.username) {
		return res.status(400).json({message: constants.httpResponseMessages.badRequest});
	}

	if (validator.isEmail(req.body.username)) {
		passport.authenticate('email', function (err, user) {
			if (err) return res.status(401).json({message: constants.httpResponseMessages.unauthorized});
			else req.logIn(user, next);
		})(req, res, next);
	}
	else {
		passport.authenticate('username', function (err, user) {
			if (err) return res.status(401).json({message: constants.httpResponseMessages.unauthorized});
			else req.logIn(user, next);
		})(req, res, next);
	}
};
