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


//TODO: support both email- and username-authentication

passport.use(new LocalStrategy(
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

module.exports = function(req, res, next){
  passport.authenticate('local', function(err, user){
      if (err) {
        res.status(403);
        return res.send({message: err});
      }
      req.logIn(user,next);
  })(req,res,next);
};