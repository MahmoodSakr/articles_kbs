const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
router = express.Router();
const users = require("../models/users");
const { check, validationResult, body } = require("express-validator");

router.get("/registration", (req, res) => {
  res.render("registration"); // registration = registration.ejs
});

// Add a new user
router.post(
  "/registration",
  [
    check("fullname", "Full Name must not be decimal or empty")
      .not()
      .isEmpty()
      .not()
      .isDecimal(),
    check(
      "email",
      "Email name must not be decimal or empty or out of email format"
    )
      .not()
      .isEmpty()
      .not()
      .isDecimal()
      .isEmail(),
    check("username", "Username must not be decimal or empty")
      .not()
      .isEmpty()
      .not()
      .isDecimal(),
    check(
      "password",
      "Password must be not empty and its length from 4 to 8 chars"
    )
      .not()
      .isEmpty()
      .isLength({ min: 4, max: 8 }),
    check("password2", "Passwords do not match").custom(
      (value, { req }) => value === req.body.password
    ),
  ],
  (req, res) => {
    // Case A: Finds the validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("validation errors : ", errors);
      errors.array().forEach((error) => {
        req.flash("danger", error.msg);
      });
      return res.redirect("/users/registration");
    }
    // Case B: create the user obj in the Db
    // user = new users(req.body);
    // because of schema the _id will be ignored but it still included in the req body
    user = new users(); // user ={}
    user.fullname = req.body.fullname;
    user.email = req.body.email;
    user.username = req.body.username;
    user.password = req.body.password;
    bcrypt.hash(user.password, 10, (error, hashedpass) => {
      if (error) {
        return res
          .status(500)
          .send("Error ocurred durning the hashing the password");
      }
      user.password = hashedpass;
      user.save((error, userObj) => {
        if (error) {
          return res
            .status(500)
            .send(
              "Error ocurred durning the adding the user document to the Db"
            );
        }
        //    console.log("New user has been added : ", userObj);
        req.flash("success", "User has been added successfully"); // Add message to be showed in the /article
        res.redirect("/users/login");
      });
    });
  }
);

router.get("/login", (req, res) => {
  res.render("login");
});

// User login and render the user profile page
router.post(
  "/login",
  [
    check("username", "Username must not be decimal or empty")
      .not()
      .isEmpty()
      .not()
      .isDecimal(),
    check("password", "Password must not empty and contain from 4 to 8 chars")
      .not()
      .isEmpty()
      .isLength({ min: 4, max: 8 }),
  ],
  (req, res, next) => {
    // Checks for the From validations
    const errors = validationResult(req);
    // Case A: There are validations errors
    if (!errors.isEmpty()) {
      console.log("Validation errors : ", errors);
      errors.array().forEach((error) => {
        req.flash("danger", error.msg);
      });
      return res.redirect("/users/login");
    }
    // Case B: User Authentication :: Checks for the users credentials by the passport module
    // By using the local strategy ( username and passport )
    console.log("-------------------------------");
    console.log("the req url is", req.url);
    console.log("Check the authentications");
    console.log("req.user ", req.user);
    console.log("res.locals.user", res.locals.user);
    console.log("req.isAuthenticated()", req.isAuthenticated());
    console.log("req.isUnauthenticated()", req.isUnauthenticated());
    // here the user credentials (username,password) are checked
    // Execute the localstratgy and serialize and deserialize functions of your file passport, and based on the deserialized return, the following route will be requested either the success or the failure
    passport.authenticate("local", {
      successRedirect: "/articles/",
      failureRedirect: "/users/login",
      failureFlash: true,
    })(req, res, next);
    /* if the user credential is correct, the successRedirect is requested and 
  the req object will contain the logined user data object, so that req.user 
  will be the currently logined user and then the two functions will be activated 
  to be used with the req user where the req.isAuthenticated() and req.isUnAuthenticated()
  Finally, req.logout() >> this function can be used to logout and make the req.user=null  
  */
  }
);

router.get("/logout", (req, res) => {
  // req.app.locals.user = null;
  console.log("---------------------------");
  console.log("pre logout fun");
  console.log("the req url is", req.url);
  console.log("the req path is", req.path);
  console.log("req.user ", req.user);
  console.log("res.locals.user", res.locals.user);
  console.log("req.isAuthenticated()", req.isAuthenticated());
  console.log("req.isUnauthenticated()", req.isUnauthenticated());

  req.logout();

  console.log("after logout fun");
  console.log("the req url is", req.url);
  console.log("req.user ", req.user);
  console.log("res.locals.user", res.locals.user);
  console.log("req.isAuthenticated()", req.isAuthenticated());
  console.log("req.isUnauthenticated()", req.isUnauthenticated());
  req.flash("success", "You are logged out");
  res.redirect("/users/login");
  console.log("---------------------------");
});

module.exports = router;
