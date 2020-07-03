var LocalStrategy = require("passport-local").Strategy; // LocalStrategy Class
const usersModel = require("../models/users");
const bycrypt = require("bcryptjs");

/*
This file adjust the local passport strategy and exports its 
function to be used in authenticate the user credentials and return either
A) Message indicate the user not founded 
B) Message indicate the user is fonded but the password isn't matched
C) The use object if founded 
*/

// this function will be the input to the LocalStrategy object
// this function will be executed when we invoke the authenticate function
// from the passport module in the login route
LocalStrategyFunction = function (username, password, done) {
  //Searching for the user name in the DB
  console.log("----------------------------");
  console.log("Function LocalStrategy ...");
  usersModel.findOne({ username: username }, (err, user) => {
    console.log("Search in the db for the credentials ...");
    if (err) throw err;
    // No user is founded
    if (user == null) {
      console.log("user obj : ", user);
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
      console.log("user obj is founded and is ", user);
      return done(null, user);
    });
  });
};
// this function will be executed after the first function is executing
serializeUserFunction = function (user, done) {
  console.log("serializeUser function");
  console.log("user", user);
  console.log("executing the done function (de-serializeUser)");
  done(null, user.id); // execute the de-serialize function
};

/* this function will be executed after the serialize function
 if the user is founded, its object will be joined to the req object, so you can use the req.user later
 and then it request the success redirect or return an error and request the 
failureRedirect from the authenticate function  */
deSerializeUserFunction = function (id, done) {
  console.log("de-serializeUser function");
  console.log("user id is : ", id);
  console.log("Search for the user by its name");
  usersModel.findById(id, function (err, user) {
    console.log("user is founded as : ", user);
    console.log("executing the done function");
    /* redirect either the success route of the authenticate function if the user is founded and append the user obj
    in to the req object ( req.user ). And the req.authenticated() will give true.
    OR redirect the failure redirect if the user is not founded, And the req.isUnauthenticated() will give true.
    */
    done(err, user);
  });
};
/* This function will be exported to be used in the authentication process where : 
Once the passport.authenticate is fired the following 3 functions will be executed consequently 
1) LocalStrategyFunction 2) serializeUserFunction 3) deSerializeUserFunction
*/
authenticationFunction = function (passport) {
  // Instantiate the local strategy class with the LocalStrategyFunction as its input
  var localStrategyObj = new LocalStrategy(LocalStrategyFunction);
  passport.use(localStrategyObj);
  passport.serializeUser(serializeUserFunction);
  passport.deserializeUser(deSerializeUserFunction);
};
module.exports = authenticationFunction;
