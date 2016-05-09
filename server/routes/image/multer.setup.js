var fs = require('fs');
var User = require('../../models/user/user.model');
var winston = require('winston');
var config = require('../../config/server.config');
var multer = require('multer');
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
				var fileName = file.originalname.replace(/ /g, '_');

				if (!req.body.overwrite === 'false') {
					if (fs.existsSync(dir + '/' + fileName)) {
						cb(new Error('Conflict'), null);
						return res.status(409).send();
					}
				}
				imagePath += fileName;
				var absolutePath = config.ABSOLUTE_IMAGE_PATH_ROOT + req.verified.id + '/' + fileName;
				req.body.absolutePath = absolutePath;
				User.findByIdAndUpdate(req.verified.id, {$addToSet: {images: absolutePath}}, {safe: true, upsert: false},
					function (err, model) {
						if (err) {
							winston.log('error', err);
							cb(err, fileName);
							return res.status(500).send();
						}
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
				winston.log('error', err);
				return res.status(500).send();
			}
			next();
		});
	}
	catch (err) {
		winston.log('error', err);
		return res.status(500).json({message: 'Internal server error'});
	}
};
