const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/user") 

module.exports = function (passport) {
  passport.use(
    new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
      User.findOne({ where: { email: email.toLowerCase() } })
        .then(user => {
          if (!user) {
            return done(null, false, { msg: `Email ${email} not found.` });
          }
          user.comparePassword(password)
            .then(isMatch => {
              if (isMatch) {
                return done(null, user);
              } else {
                return done(null, false, { msg: "Invalid email or password." });
              }
            })
            .catch(err => done(err));
        })
        .catch(err => done(err));
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findByPk(id)
      .then(user => done(null, user))
      .catch(err => done(err));
  });
};
