const express = require("express");
const bycrypt = require("bcryptjs");
const passport = require("passport");
router = express.Router();
const users = require("../models/users");
const { check, validationResult, body } = require("express-validator");

router.get("/registration", (req, res) => {
  res.render("registration"); // registration = registration.ejs
});

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
    check("password", "Password must not empty and contain from 4 to 8 chars")
      .not()
      .isEmpty()
      .isLength({ min: 4, max: 8 }),
    check("password2", "Passwords do not match").custom(
      (value, { req }) => value === req.body.password
    ),
  ],
  (req, res) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    console.log("errors : ", errors);
    if (!errors.isEmpty()) {
      errors.array().forEach((error) => {
        req.flash("danger", error.msg);
      });
      return res.redirect("/users/registration");
    }
    // user = new users(req.body);
    // because of schema the _id will be ignored but it still included in the req body
    user = new users();
    user.fullname = req.body.fullname;
    user.email = req.body.email;
    user.username = req.body.username;
    user.password = req.body.password;
    bycrypt.hash(user.password, 10, (error, hashedpass) => {
      if (error) {
        log.error(error);
        return;
      }
      user.password = hashedpass;
      user.save((error, user) => {
        if (error) {
          log.error(error);
          return;
        }
        console.log("New user has been added : ", user);
        req.flash("success", "User has been added successfully"); // Add message to be showed in the /article
        res.redirect("/users/login");
      });
    });
  }
);

router.get("/login", (req, res) => {
  res.render("login");
});

// profile
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
    const errors = validationResult(req);
    console.log("Validation errors : ", errors);
    if (!errors.isEmpty()) {
      errors.array().forEach((error) => {
        req.flash("danger", error.msg);
      });
      return res.redirect("/users/login");
    }
    // checks the users credentials

    passport.authenticate("local", {
      successRedirect: "/articles/",
      failureRedirect: "/users/login",
      failureFlash: true,
    })(req, res, next);
  }
);

router.get("/logout", (req, res) => {
  req.flash("success", "You are logged out.");
  res.redirect("/users/login");
});

module.exports = router;
