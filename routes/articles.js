const express = require("express");
router = express.Router();
// Express Validator Middleware
const { check, validationResult, body } = require("express-validator");
const articles = require("../models/articles");
const users = require("../models/users");

function checkArticle(req, res, next) {
  articles.findById(req.params.id, (error, article) => {
    if (error) {
      return res.status(500).json({ message: error.message }); // server error
    } else {
      req.founded = article == null ? false : article; // existed or not
      next();
    }
  });
}

// Access control on the routes / to protect a route

// router.get("*", (req, res, next) => {
//   if (req.user == null) {
//     req.flash("danger", "You must sign in firstly !");
//     return res.redirect("/users/login");
//   } else {
//     return next();
//   }
// });

// or by a Middle ware
function ensureAuthenticate(req, res, next) {
  if (req.isAuthenticated()) {
    //== if(req.user!=null)
    return next(); // keep going
  } else {
    req.flash("danger", "You must sign in firstly !");
    return res.redirect("/users/login");
  }
}

router.delete("/delete", ensureAuthenticate, async (req, res) => {
  // This request comes from ajax
  try {
    // Whether the user is login
    if (!req.user._id) {
      return res.status(401).json({
        message: "Forbidden deletion process, please login firstly",
      });
    }
    article = await articles.findById(req.body.id);
    if (article == null) {
      return res.status(401).json({
        message: "No article is founded to be deleted",
      });
    }
    if (article.authorId == req.user._id) {
      return res.status(401).json({
        message: "This user is not authorized to delete this article",
      });
    }

    deletedResult = await articles.deleteMany({ _id: req.body.id });
    if (deletedResult.deletedCount > 0) {
      console.log("Deleted is done with count: " + deletedResult.deletedCount);
      req.flash("danger", "Article has been deleted");
      res.status(200).json({ message: "deleted is done" }); // send as the response of the ajax , ajax will redirect to the /
    } else {
      res.status(500).json({ message: "Article is founded but not deleted" });
    }
  } catch (error) {
    res.status(500).json({
      message: "An error is occurred: " + error.message,
    });
  }
});

router.get("/update/:id", ensureAuthenticate, (req, res) => {
  articles.findById(req.params.id, (error, article) => {
    if (error) {
      return res.status(500).send(error.message);
    }
    if (article == null) {
      req.flash("danger", "This article is not founded to be updated");
      return res.redirect("/users/login");
    }
    if (article.authorId != req.user._id) {
      req.flash(
        "danger",
        "This user is not authorized to updated this article"
      );
      return res.redirect("/users/login");
    }
    res.render("update_article.ejs", {
      title: "Update Article",
      article: article,
    });
  });
});

router.patch(
  "/update",
  ensureAuthenticate,
  [
    check("title", "Article title must not be decimal or empty")
      .not()
      .isEmpty()
      .not()
      .isDecimal(),
    check("body", "Article Body must not be decimal or empty")
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
      if (updatedResult.nModified > 0) {
        //update is done
        req.flash("success", "Article is updated successfully"); // Add message to be showed
        // res.redirect("/articles");
        res.status(201).json({ message: "Update is successes" });
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

// Validation the req body coming from the add / insert article form
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
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    console.log("Validation errors : ", errors);
    if (!errors.isEmpty()) {
      return res.status(421).json(errors.array()); // handle it in  ajax response in the front end
    }
    try {
      // article = new articles(req.body);
      // because of schema the _id will be ignored but it still included in the req body
      article = new articles();
      article.title = req.body.title;
      article.authorId = req.user._id; // the login user will be the owner of the book
      article.body = req.body.body;
      saved_article = await article.save();
      console.log("New article has been added: ", saved_article);
      req.flash("success", "Article has been added successfully"); // Add message to be showed in the /article
      res.status(201).send("Article has been added successfully"); // will send to the ajax to redirect the page to /
      // res.status(201).json(saved_article);
    } catch (error) {
      // will be thrown when the required element come without data
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/", async (req, res) => {
  // res.render("articles.ejs", { title: "Articles " });
  try {
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
  res.render("add_article.ejs", { title: "Add An Article" });
});

router.get("/:id", async (req, res) => {
  try {
    article = await articles.findById(req.params.id);
    console.log("article: ", article);
    if (article != null) {
      // res.status(200).json(articlesResult);
      user = await users.findById(article.authorId);
      if (user != null) {
        res.render("article", {
          founded: true,
          article: article,
          authorName: user.fullname,
        });
      } else {
        res.render("article", {
          founded: true,
          article: article,
          authorName: "Author was deleted",
        });
      }
    } else {
      res.render("article.ejs", { founded: false });
      // res.status(404).json({ mess: "Sorry, no data is founded" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
