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

router.use(function (req, res, next) {
	next();
});

module.exports = function (app) {
	router.post('/users/:user_id/images', verifyToken, setupMulter, function (req, res) {
		if (req.imagePath) return res.status(422).json({message: 'Missing image file'});
		return res.status(202).send();
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
				var fileName = file.originalname;
				if (fs.existsSync(dir + '/' + fileName)) {
					return;
				}
				imagePath += fileName;
				cb(null, fileName);
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
