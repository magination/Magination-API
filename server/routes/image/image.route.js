var express = require('express');
var router = express.Router();
var verifyToken = require('../login/verifyToken');
var constants = require('../../config/constants.config');
var _ = require('lodash');
var winston = require('winston');
var logger = require('../../logger/logger');
var multer = require('multer');
var storage;
var fs = require('fs');
var config = require('../../config/server.config');
var User = require('../../models/user/user.model');
var dirTree = require('directory-tree');
var setupMulter = require('./multer.setup');

router.use(function (req, res, next) {
	next();
});

module.exports = function (app) {
	router.get('/public/editor', function (req, res) {
		var tree = dirTree('public/img/editor/');
		return res.status(200).json(tree);
	});
	router.post('/users/:user_id/images', verifyToken, setupMulter, function (req, res) {
		return res.status(202).send();
	});

	router.delete('/users/:user_id/images', verifyToken, function (req, res) {
		if (req.params.user_id !== req.verified.id) return res.status(401).send();
		if (!req.body.url) return res.status(400).send();
		var imageURL = req.body.url;
		var imageName = getImageNameFromUrl(imageURL);
		var pathToImg = config.LOCAL_ROOT_IMAGE_PATH + '/upload/' + req.verified.id + '/' + imageName;
		if (!fs.existsSync(pathToImg)) {
			return res.status(404).send();
		}
		else {
			fs.unlink(pathToImg, function (err) {
				if (err) {
					logger.log('error', 'DELETE /users/:user_id/images', err);
					return res.status(500).send();
				}
				User.findByIdAndUpdate(req.verified.id, {$pull: {images: imageURL}}, {safe: true}, function (err, model) {
					if (err) {
						logger.log('error', 'DELETE /users/:user_id/images', err);
						return res.status(500).send();
					}
					if (!model) return res.status(404).send();
					else return res.status(204).send();
				});
			});
		}
	});

	router.get('/users/:user_id/images', function (req, res) {
		User.findById({_id: req.params.user_id}, function (err, user) {
			if (err) {
				logger.log('error', 'GET /users/:user_id/images', err);
				return res.status(500).send();
			}
			return res.status(200).json(user.images);
		});
	});
	return router;
};

var getImageNameFromUrl = function (url) {
	var name = url.substr(url.lastIndexOf('/') + 1, url.length);
	return name;
};
