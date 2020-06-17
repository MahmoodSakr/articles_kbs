// Adjust the passport strategy in details
const LocalStrategy = require("passport-local").Strategy;
const usersModel = require("../models/users");
const bycrypt = require("bcryptjs");

module.exports = function (passport) {
  // 1- Use function to apply the Local strategy
  passport.use(
    // Specify the login credentials
    new LocalStrategy(function (username, password, done) {
      //Searching for the user name in the DB
      usersModel.findOne({ username: username }, (err, user) => {
        if (err) throw err;
        // No user is founded
        if (user == null) {
          return done(null, false, { message: "No user is founded" });
        }
        // User is founded but we are going to check his user
        bycrypt.compare(password, user.password, (err, matched) => {
          if (err) throw err;
          if (!matched) {
            // login password is not founded
            return done(null, false, {
              message: "User password doesn't match",
            });
          }
          // The login password is founded
          return done(null, user);
        });
      });
    })
  );
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });
  passport.deserializeUser(function (id, done) {
    usersModel.findById(id, function (err, user) {
      done(err, user);
    });
  });
};
