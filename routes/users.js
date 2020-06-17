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
    passport.authenticate("local", {
      successRedirect: "/articles/",
      failureRedirect: "/users/login",
      failureFlash: true,
    })(req, res, next);
  }
);

router.get("/logout", (req, res) => {
  res.locals.user = null;
  req.flash("success", "You are logged out");
  res.redirect("/users/login");
});

module.exports = router;
