var express = require('express');
var path = require('path');
var baucis = require('baucis');
var router = express.Router();


module.exports = function(app){
  
  router.get('/', function(req, res){
    res.send('Welcome to the Magination API. Here is a list of the current API:');
  });

  return router;
};