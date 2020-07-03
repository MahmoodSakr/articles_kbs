const express = require("express");
router = express.Router();
const articles = require("../models/articles"); // The article model to be used as the articles collection
const users = require("../models/users"); // The users model to be used as the users collection
// Express Validator Middleware -- to validate the form body params
const { check, validationResult, body } = require("express-validator");

function checkArticle(req, res, next) {
  articles.findById(req.params.id, (error, article) => {
    if (error) {
      // instead of catch if your handle it as a promise
      return res.status(500).json({ message: error.message }); // server error
    } else {
      // add a flag variable called founded in the req object to be used in the next middleware
      req.founded = article == null ? false : article; // existed or not
      next();
    }
  });
}

// Access control on the routes that required login firstly / to protect a route // if the user is login the route will be available to be used
function ensureAuthenticate(req, res, next) {
  // Whether the user who request this api is authenticated/logined ot not
  console.log("--------------------------------");
  console.log("During the authentication function");
  console.log("the req url is", req.url);
  console.log("req.user ", req.user);
  console.log("res.locals.user", res.locals.user);
  console.log("req.isAuthenticated()", req.isAuthenticated());
  console.log("req.isUnauthenticated()", req.isUnauthenticated());
  console.log("--------------------------------");

  if (req.isAuthenticated()) {
    return next(); // keep going to the protected route
  } else {
    req.flash("danger", "You must sign in firstly !");
    return res.redirect("/users/login");
  }
}

router.delete("/delete", async (req, res) => {
  // This request comes from ajax, so you must handle the res manually and don't include and redirect
  // as the ajax make the redirect after the response return with failed.

  // Case A: Whether the user is login firstly
  if (req.user._id == null) {
    return res.status(403).json({
      message: "Forbidden deletion process, please login firstly",
    });
  }
  try {
    // Case B: Whether this article is existed or not
    article = await articles.findById(req.body.id);
    if (article == null) {
      return res.status(404).json({
        message: "No article is founded to be deleted",
      });
    }
    // Case C: Article is founded but whether the deleting user is the same owner user
    if (article.authorId != req.user._id) {
      return res.status(403).json({
        message:
          "This user is not the article's owner, so he is not authorized to delete this article",
      });
    }
    // All the precautious are safety, you can delete the article safely.
    deletedResult = await articles.deleteMany({ _id: req.body.id });
    // if(deletedResult.deletedCount > 0){
    if (deletedResult != null) {
      console.log("Deletion is done with count: " + deletedResult.deletedCount);
      req.flash(
        "danger",
        deletedResult.deletedCount + " Article has been deleted"
      );
      res.sendStatus(200);
    } else {
      res.status(500).json({ message: "Article is existed but not deleted" });
    }
  } catch (error) {
    res.status(500).json({
      message: "An error is caught: " + error.message,
    });
  }
});

router.get("/update/:id", ensureAuthenticate, (req, res) => {
  // Case A : Whether article is existed
  articles.findById(req.params.id, (error, article) => {
    if (error) {
      return res.status(500).send(error.message);
    }
    // Article is not founded
    if (article == null) {
      req.flash("danger", "This article is not founded to be updated");
      return res.redirect("/users/login");
    }
    // Case B : whether the updating user is the same owner user
    if (article.authorId != req.user._id) {
      req.flash(
        "danger",
        "This user is not authorized to updated this article"
      );
      return res.redirect("/users/login");
    }
    // All the precautious are safety, you can update the article safely
    res.render("update_article", {
      title: "Update Article",
      article: article,
    });
  });
});

// invoked by an ajax request
router.patch(
  "/update",
  ensureAuthenticate,
  [
    check("title", "Article title must not be decimal or empty")
      .not()
      .isEmpty()
      .not()
      .isDecimal(),
    check("body", "Article body must not be decimal or empty")
      .not()
      .isEmpty()
      .not()
      .isDecimal(),
  ],
  async (req, res) => {
    // Validation the req body coming from the update form
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // make the server simply the errors array before reply to the client
      // mess = "Validation Errors are: \n";
      // errors.array().forEach((item) => (mess += item.msg + " \n "));
      // return res.status(421).json({ errors: mess });
      return res.status(421).json(errors.array()); // handle it in ajax response in the front end
    }
    // No validation error , continue the logic
    try {
      updatedResult = await articles.updateMany(
        { _id: req.body._id },
        {
          $set: {
            title: req.body.title,
            body: req.body.body,
          },
        }
      );
      // We maked sure that the article is already founded as shown above
      if (updatedResult.nModified > 0) {
        //update is done
        req.flash("success", "Article is updated successfully"); // Add message to be showed
        // res.redirect("/articles"); // the redirect will be made from the ajax
        res.sendStatus(201);
      } else {
        res.status(500).json({
          message:
            "Sorry, these data are existed before totally, try to change any",
        });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// This will be requested from an ajax
router.post(
  "/add",
  ensureAuthenticate,
  [
    check("title", "Article title must not be decimal or empty")
      .not()
      .isEmpty()
      .not()
      .isDecimal(),
    // check("author", "Author name must not be decimal or empty")
    //   .not()
    //   .isEmpty()
    //   .not()
    //   .isDecimal(),
    check("body", "Article body must not be decimal or empty")
      .not()
      .isEmpty()
      .not()
      .isDecimal(),
  ],
  async (req, res) => {
    // Case 1 : checks for the form validation
    const errors = validationResult(req);
    console.log("Validation errors : ", errors);
    if (!errors.isEmpty()) {
      return res.status(421).json(errors.array()); // handle it in  ajax response in the front end
    }
    // Create a new article in the DB model
    try {
      // article = new articles(req.body);
      // because of schema the _id will be ignored but it still included in the req body
      article = new articles();
      article.title = req.body.title;
      article.authorId = req.user._id; // the login user will be the owner of the book
      article.body = req.body.body;
      saved_article = await article.save(); // create this document obj in the Db
      if (saved_article == null) {
        return res
          .status(500)
          .json({ message: "Error is occurred during saving the article" });
      }
      req.flash("success", "Article has been added successfully"); // Add message to be showed in the /article
      res.sendStatus(201); // will send to the ajax to redirect the page to /
    } catch (error) {
      // will be thrown when the required element come without data
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/", async (req, res) => {
  // res.render("articles.ejs", { title: "Articles " });
  try {
    // get all the articles documents as an array
    // if the model is empty, the array length = 0
    articlesResults = await articles.find();
    if (articlesResults.length > 0) {
      console.log("There are : " + articlesResults.length, " articles");
      res.render("articles", { articlesResults });
      // res.status(200).json(articlesResults);
    } else {
      console.log("articlesResult: ", articlesResults);
      res.render("articles", { articlesResults });
      // res.status(404).json({ mess: "Sorry, no data is founded" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/add", ensureAuthenticate, (req, res) => {
  res.render("add_article", { title: "Add An Article" });
});

router.get("/:id", async (req, res) => {
  try {
    article = await articles.findById(req.params.id);
    // Case A: Whether this article is found
    if (article != null) {
      // res.status(200).json(article);
      // Get the article owner
      user = await users.findById(article.authorId);
      // Case B : Whether the owner user is founded
      // The owner user is existed
      if (user != null) {
        res.render("article", {
          founded: true,
          article: article,
          authorName: user.fullname,
        });
      }
      // The owner user is not existed
      else {
        res.render("article", {
          founded: true,
          article: article,
          authorName: "Author was deleted",
        });
      }
    }
    // Case c: article is not founded
    else {
      res.render("article.ejs", { founded: false });
      // res.status(404).json({ mess: "Sorry, no data is founded" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
