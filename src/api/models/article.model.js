const mongoose = require("mongoose");

const { Schema } = mongoose;

// Define the schema for an article
const articleSchema = new Schema(
  {
    articleTitle: {
      type: String,
      required: true,
      trim: true,
    },
    articleCategory: {
      type: String,
      required: true,
      trim: true,
    },
    articleContent: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: "7d", // TTL index: document will be removed after 7 days
    },
  },
  { timestamps: true }
);

// Create the model from the schema
const Article = mongoose.model("Article", articleSchema);

module.exports = Article;
