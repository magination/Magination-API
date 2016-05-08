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
var dirTree = require('directory-tree');
var setupMulter = require('../image/multer.setup');

router.use(function (req, res, next) {
	next();
});

module.exports = function (app) {
	router.get('/public/pieces', function (req, res) {
		var tree = dirTree('public/img/pieces');
		return res.status(200).json(tree);
	});
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
