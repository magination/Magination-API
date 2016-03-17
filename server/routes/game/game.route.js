var express = require('express');
var router = express.Router();
var Game = require('../../models/game/game.model');

router.use(function(req, res, next) {
    //Todo add middleware?
    next();
});

module.exports = function(app){
    router.route('/games')
        .post(function(req, res) {
            if(!req.body.title || !req.body.description || !req.body.owner){
                res.status(400);
                res.json({message : 'Missing property game title, game description or game owner.'})
                return;
            }
            var game = new Game();
            game.title = req.body.title;
            game.description = req.body.description;
            game.owner = req.body.owner;
            game.save(function(err) {
                if (err){
                    res.status(500);
                    res.json({message : 'Internal server error.'})
                }
                res.status(201);
                res.json({
                    message: 'Game ' + game.id + ' created!'
                });

            })
        })
        .get(function(req, res) {
            Game.find(function(err, game) {
                if (err){
                    res.status(500);
                    res.json({message : 'Internal server error.'})
                }
                res.json(game);
            });
        });

    router.route('/games/:game_id')
        .get(function(req, res) {
            Game.findById(req.params.game_id, function (err, game) {
                if (err)
                    res.send(err);
                if (game == null) {
                    res.status(404);
                    res.json({message: 'Game not found.' })
                    return;
                } else {
                    res.json(game);
                }
            })
        })
        .delete(function(req, res) {
            Game.remove({
                _id: req.params.game_id
            }, function(err, game) {
                if(!game){
                    res.status(404);
                    res.json({message : 'Game with given id not found'})
                    return;
                }
                if (err)
                    res.send(err);
                res.json({ message: 'Successfully deleted game '+req.params.game_id });
            });
        });

    return router;
}