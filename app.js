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

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// set Public folder
// use this file  for the public assets like js, css , imgs files
app.use(express.static(path.join(__dirname, "public")));

// Express Session Middleware
app.use(
  session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true,
  })
);

// Express Messages Middleware
app.use(require("connect-flash")());
app.use(function (req, res, next) {
  res.locals.messages = require("express-messages")(req, res);
  next();
});

// Passport config -Importing file-
require("./config/passport")(passport);

// Passport middlewares
app.use(passport.initialize());
app.use(passport.session());

// Make a global var : to be used in any frontend and backend or js file along with the lifetime of the express app
app.get("*", (req, res, next) => {
  res.locals.user = req.user || null; // obtained from the passport middle ware
  global.ttt = "any Value";
  next();
});

// app.use(function (req, res, next) {
//   res.locals.user = req.user || null; // obtained from the passport middle ware
//   global.ttt = "any Value";
//   next();
// });

// Make a connection to DB server
const DB_url =
  "mongodb+srv://sakr:root@firstcluster-n7gej.mongodb.net/test?retryWrites=true&w=majority";
mongoose.connect(DB_url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// mongoose.connect(process.env.DB_Url, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

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
  req.flash("success", "Thanks for your message");
  res.redirect("/articles");
});

// Routes files
app.use("/articles", require("./routes/articles"));
app.use("/users", require("./routes/users"));
PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server begin listening on port ${PORT}`));
