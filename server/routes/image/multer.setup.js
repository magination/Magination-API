var fs = require('fs');
var User = require('../../models/user/user.model');
var logger = require('../../logger/logger');
var config = require('../../config/server.config');
var multer = require('multer');
var imageConfig = require('./image.config.js');
var storage;

module.exports = function (req, res, next) {
	try {
		var dir = config.LOCAL_ROOT_IMAGE_PATH + '/upload/' + req.verified.id;
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
				var fileName = null;
				if (req.params.setPictureName) {
					fileName = req.params.setPictureName;
				} else {
					fileName = file.originalname.replace(/ /g, '_');
					fileName = fileName.replace('/', '');
				}
				if (fileName.length === 0) {
					cb(new Error('Filename length empty'), null);
					return res.status(400).json({message: 'filname can not be empty.'});
				}
				if (req.params.overwrite === 'false') {
					if (fs.existsSync(dir + '/' + fileName)) {
						cb(new Error('Conflict'), null);
						return res.status(409).send();
					}
				}
				if (imageConfig.ACCEPTED_MIME_TYPES.indexOf(file.mimetype) === -1) {
					cb(new Error('Image mimetype not accepted.'), null);
					return res.status(400).json({message: 'mimetype not accepted.'});
				}
				imagePath += fileName;
				var absolutePath = config.ABSOLUTE_IMAGE_PATH_ROOT + req.verified.id + '/' + fileName;
				req.body.absolutePath = absolutePath;
				User.findByIdAndUpdate(req.verified.id, {$addToSet: {images: absolutePath}}, {safe: true, upsert: false},
					function (err, model) {
						if (err) {
							logger.log('error', 'multer.setup.js', err);
							cb(err, fileName);
							return res.status(500).send();
						}
						if (!model) return res.status(404).send();
						if (parseInt(model.numberOfAllowedPictures) <= parseInt(model.images.length)) {
							cb(new Error('Number of allowed pictures exceeded.'), fileName);
							return res.status(400).json({message: 'Number of allowed pictures exceeded'});
						}
						cb(null, fileName);
					}
				);
			}
		});
		var upload = multer({ storage: storage }).single('image');
		upload(req, res, function (err) {
			if (err) {
				logger.log('error', 'multer.setup.js', err);
				return res.status(500).send();
			}
			next();
		});
	} catch (err) {
		logger.log('error', 'multer.setup.js', err);
		return res.status(500).json({message: 'Internal server error'});
	}
};
