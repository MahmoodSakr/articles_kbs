const mongoose = require("mongoose");
// instantiate the schema object
articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  authorId: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
});
// Export the model where its name and schema are below
module.exports = mongoose.model("articles", articleSchema);
