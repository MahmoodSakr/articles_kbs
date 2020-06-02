const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
// require("dotenv").config();
require("ejs");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
// inti web application
const app = express();

// load view engine
app.set("views", path.join(__dirname, "views")); // optional
app.set("view engine", "ejs");

// Middlewares Functions
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public"))); // use this public folder for the public assets usage like js, css , imgs files
// To enable the usage of the flash message, we use two middle ware the express session and connect flash
app.use(
  session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(require("connect-flash")());
app.use(function (req, res, next) {
  res.locals.messages = require("express-messages")(req, res);
  next();
});

// To enable the usage of the passport strategy
require("./config/passport")(passport); // Passport config -Importing file
// Passport middlewares
app.use(passport.initialize());
app.use(passport.session());

// Create a local var : to be used in any frontend and backend or js file along with the lifetime of the express app
app.get("*", (req, res, next) => {
  res.locals.user = req.user || null; // obtained from the passport middle ware
  // the variable res.locals.user is used as user only in the ejs template files and as req.user in all backend js files
  //global.ttt = "any Value"; // another way to create a global variables
  next();
});
// Or by using this middleware which will be executed automatically with every req
// app.use(function (req, res, next) {
//   res.locals.user = req.user || null; // obtained the user global value from the passport middle ware
//   global.ttt = "any Value";
//   next();
// });

// Make a connection to DB server
// const DbURl =
//   "mongodb+srv://sakr:root@firstcluster-n7gej.mongodb.net/test?retryWrites=true&w=majority";
// mongoose.connect(DbURl, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// DbURl is setted in the heroko configuration values
mongoose.connect(process.env.DbURl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// check for the connection status
db = mongoose.connection;
db.once("open", () => {
  console.log("Db is connected");
});
db.on("error", (err) => {
  console.error("Error with mess: ", err.message);
});

// Home Route
app.get("/", function (req, res) {
  res.redirect("/articles");
});
// Home Route
app.get("/about", function (req, res) {
  res.render("about");
});

app.post("/about", function (req, res) {
  req.flash("success", "Thanks for your message"); // to be shown in the articles.js
  res.redirect("/articles");
});

// Routes files
app.use("/articles", require("./routes/articles"));
app.use("/users", require("./routes/users"));
PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server begin listening on port ${PORT}`));
