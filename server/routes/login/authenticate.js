var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../../models/user/user.model');


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});



passport.use('username', new LocalStrategy(
  {
    session:false
  },
  function(username, password, done) {

    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) return done('Incorrect username');
      user.validPassword(password)
        .then(function(result){
          if(result) return done(null,user);
          done('Incorrect password');
          }).catch(function(err){
            return done('Something went wrong :(',null);
        });
    });
  }
));


passport.use('email', new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
    session:false
  },
  function(username, password, done) {

    User.findOne({ email: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) return done('Incorrect email');
      user.validPassword(password)
        .then(function(result){
          if(result) return done(null,user);
          done('Incorrect password');
          }).catch(function(err){
            return done('Something went wrong :(',null);
        });
    });
  }
));

module.exports = function(req, res, next){
  if(! req.body.password | (!req.body.email && !req.body.username)){
    return res.status(403).json({message: 'bad request'});
  }

  if(req.body.username){
    passport.authenticate('username', function(err, user){
        if (err) {
          res.status(401);
          return res.send({message: err});
        }
        req.logIn(user,next);
    })(req,res,next);
  }
  else if(req.body.email){
    passport.authenticate('email', function(err, user){
        if (err) {
          res.status(401);
          return res.send({message: err});
        }
        req.logIn(user,next);
    })(req,res,next);
  }
};