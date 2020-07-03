const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const passport = require("passport");
const localStrategyFun = require("./config/passport"); // To apply the local strategy function
const nodemailer = require("nodemailer");
const flash = require("connect-flash");
const session = require("express-session");
const express_messages = require("express-messages");
const ejs = require("ejs");
const { check, validationResult } = require("express-validator");
const articlesRouterFile = require("./routes/articles");
const usersRouterFile = require("./routes/users");
const moment = require("moment");
// require("dotenv").config();

// inti web application
const app = express();

//Assign a value to a setting variables e.g.
// load view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // optional
console.log("The default view engine is : ", app.get("view engine"));

//----------Middlewares Functions----------------
// Enable parsing any json object from any req
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// use this public folder for the public assets usage like js, css , imgs files and handle any request to any html pages included in it
app.use(express.static(path.join(__dirname, "public")));
// To enable the usage of the flash message req.flash('type',"message")
// We use three middlewares the express session + connect flash + manual middle ware to create a message local var
app.use(
  session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());
app.use(function (req, res, next) {
  res.locals.messages = express_messages(req, res);
  next();
});
// To use the passport strategy, use the next 2 middlewares then call the localStrategyFun which is exported from the config folder
app.use(passport.initialize());
app.use(passport.session());
localStrategyFun(passport); // send the passport module as input to the imported authentication function based on the (local strategy)

//--------------MongoDb------------------
function Db_connection_from_localhost() {
  const Db_url = "mongodb://localhost:27017/localDb";
  mongoose.connect(Db_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}
function Db_connection_from_heroku() {
  // DbURl is set in the heroku configuration values - process.env.keys ... the keys stored in the heroku system
  // const DbURl =
  //   "mongodb+srv://sakr:root@firstcluster-n7gej.mongodb.net/test?retryWrites=true&w=majority";
  mongoose.connect(process.env.DbURl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}
// Db_connection_from_localhost()
Db_connection_from_heroku();
// check for the connection status with the following two events on the connection object
db_connection = mongoose.connection;
db_connection.once("open", () => {
  console.log("Db is connected successfully ...");
});
db_connection.on("error", (err) => {
  console.error(
    "Error is occurred during the db connection with mess: ",
    err.message
  );
});

//------------------- Routes -------------------
// all requests will be accessed here
app.use(function (req, res, next) {
  // req.isAuthenticated() == true if the req.user is true
  res.locals.user = req.user || null; // obtained the user obj after be logined from the passport middleware
  next();
});

// Home route
app.get("/", function (req, res) {
  res.redirect("/articles");
});

// About route
app.get("/contactMe", function (req, res) {
  res.render("contactMe");
});

app.post(
  "/sendEmail",
  [
    check("comment", "Sorry, don't leave the comment area empty")
      .not()
      .isEmpty(),
  ],
  (req, res) => {
    // Checks for the email form validations
    const errors = validationResult(req);
    // Case A: There are validations errors
    if (!errors.isEmpty()) {
      errors.array().forEach((error) => {
        req.flash("danger", error.msg);
      });
      return res.redirect("/about");
    }
    // Case B : no error, so proceeding the email sending
    // Create an email transporter with its options to control all the email configurations
    var email_transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "sakrservices2020@gmail.com",
        pass: "a000000*",
      },
    });
    // heroku configuration
    /*
     var transporter = nodemailer.createTransport({
       service: "gmail",
       auth: {
         user: process.env.emailusername,
         pass: process.env.emailpass,
       },
     });
*/
    var mailOptions = {
      from: "sakrservices2020@gmail.com",
      to: "ma7mouedsakr@gmail.com",
      subject: "Sending Email using Node.js - Article system",
      text:
        "firstname: " +
        req.body.fname +
        " -- secondname: " +
        req.body.lname +
        " -- Comment: " +
        req.body.comment,
    };

    email_transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        req.flash(
          "danger",
          "An error is occurred during sending the email, its message is : " +
            error.message
        );
        console.log(
          "An error is occurred during sending the email, its message is : " +
            error.message
        );
        res.redirect("/about");
      } else {
        req.flash("success", "Email has been send successfully");
        console.log(
          "Email has been send successfully and the info message is : " +
            info.response
        );
        res.redirect("/articles");
      }
    });
  }
);

// Handle other routes in separated router files
app.use("/articles", articlesRouterFile);
app.use("/users", usersRouterFile);
app.use((req, res, next) => {
  req.logOut();
  res.render("badRequest");
});

// Adjust the port number to listen the incoming requests
CurrentTime = moment().format();
PORT = process.env.PORT || 5000;
// Run the express application to listen and handle the incoming request routes
app.listen(PORT, () =>
  console.log(`Server begin listening on port ${PORT} at time: ${CurrentTime}`)
);
