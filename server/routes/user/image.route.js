var express = require('express');
var router = express.Router();
var verifyToken = require('../login/verifyToken');
var constants = require('../../config/constants.config');
var _ = require('lodash');
var winston = require('winston');
var multer = require('multer');
var storage;
var fs = require('fs');
var config = require('../../config/server.config');
var User = require('../../models/user/user.model');

router.use(function (req, res, next) {
	next();
});

module.exports = function (app) {
	router.post('/users/:user_id/images', verifyToken, setupMulter, function (req, res) {
		return res.status(202).send();
	});
	router.get('/users/:user_id/images', function (req, res) {
		User.findById({_id: req.params.user_id}, function (err, user) {
			if (err) return res.status(500).send();
			return res.status(200).json(user.images);
		});
	});
	return router;
};
var setupMulter = function (req, res, next) {
	try {
		var dir = config.LOCAL_ROOT_IMAGE_PATH + '/' + req.params.user_id;
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}
		var imagePath = '';
		storage = multer.diskStorage({
			destination: function (req, file, cb) {
				imagePath += dir + '/';
				cb(null, dir);
			},
			filename: function (req, file, cb) {
				var fileName = file.originalname.replace(/ /g, '_');
				if (fs.existsSync(dir + '/' + fileName)) {
					return;
				}
				imagePath += fileName;
				var absolutePath = config.ABSOLUTE_IMAGE_PATH_ROOT + req.params.user_id + '/' + fileName;
				User.findByIdAndUpdate(req.verified.id, {$push: {images: absolutePath}}, {safe: true, upsert: false},
					function (err, model) {
						if (err) {
							console.log(err);
							cb(err, fileName);
						}
						cb(null, fileName);
					}
				);
			}
		});
		var upload = multer({ storage: storage }).single('image');
		upload(req, res, function (err) {
			if (err) {
				return res.status(500).send();
			}
		});
		next();
	}
	catch (err) {
		console.log('500d in multer: ' + err);
		return res.status(500).json({message: 'Internal server error'});
	}
};
