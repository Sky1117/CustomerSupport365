const Article = require("../models/article.model");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");
const util = require("util");
const unlinkAsync = util.promisify(fs.unlink);
const moment = require("moment");

// Create a new Article
Article.init()
  .then(() => {
    console.log("Indexes ensured");
  })
  .catch((error) => {
    console.error("Error ensuring indexes:", error);
  });

const createArticle = async (req, res) => {
  const createdBy = req.userId;
  try {
    const { articleTitle, articleCategory, articleContent, isActive } =
      req.body;

    // Validate request data
    if (!articleTitle || !articleCategory || !articleContent) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create and save the article
    const article = new Article({
      articleTitle,
      articleCategory,
      articleContent,
      isActive,
      createdBy,
    });
    await article.save();

    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all Articles
const getAllArticles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not specified
    const limit = parseInt(req.query.limit) || 10; // Default to 10 documents per page if not specified

    const skip = (page - 1) * limit;

    const articles = await Article.find().skip(skip).limit(limit);
    const totalArticles = await Article.countDocuments(); // Total number of articles in the collection

    res.status(200).json({
      totalArticles,
      page,
      limit,
      totalPages: Math.ceil(totalArticles / limit),
      articles,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getArticleById = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: "Article ID is required" });
    }

    const article = await Article.findById(id);

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.status(200).json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single Article by ID
const getArticlesByCategory = async (req, res) => {
  try {
    const { category } = req.query;
    const articles = await Article.find({ articleCategory: category });

    if (articles.length === 0) {
      return res
        .status(404)
        .json({ message: "No articles found in this category" });
    }

    res.status(200).json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an Article by ID
const updateArticleById = async (req, res) => {
  try {
    const { articleTitle, articleCategory, articleContent, _id } = req.body;

    // Validate request data
    if (!articleTitle || !articleCategory || !articleContent) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find and update the article
    const updatedArticle = await Article.findByIdAndUpdate(
      _id,
      { articleTitle, articleCategory, articleContent },
      { new: true, runValidators: true }
    );

    if (!updatedArticle) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.status(200).json(updatedArticle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete an Article by ID
const deleteArticleById = async (req, res) => {
  try {
    const { id } = req.query;
    const deletedArticle = await Article.findByIdAndDelete(id);

    if (!deletedArticle) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.status(200).json({ message: "Article deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const searchArticles = async (req, res) => {
  try {
    const {
      articleTitle,
      articleCategory,
      articleContent,
      page = 1,
      limit = 10,
    } = req.query;

    console.log("Query Parameters:", req.query);

    // Initialize search criteria
    let searchCriteria = {};

    // Build search criteria only if valid values are provided
    if (articleTitle) {
      searchCriteria.articleTitle = { $regex: articleTitle, $options: "i" };
    }
    if (articleCategory) {
      searchCriteria.articleCategory = {
        $regex: articleCategory,
        $options: "i",
      };
    }
    if (articleContent) {
      searchCriteria.articleContent = { $regex: articleContent, $options: "i" };
    }

    // Check if search criteria is empty
    if (Object.keys(searchCriteria).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid search parameters provided" });
    }

    // Convert page and limit to integers and validate
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    if (isNaN(pageNumber) || pageNumber <= 0) {
      return res.status(400).json({ message: "Invalid page number" });
    }
    if (isNaN(limitNumber) || limitNumber <= 0) {
      return res.status(400).json({ message: "Invalid limit number" });
    }

    const skip = (pageNumber - 1) * limitNumber;

    console.log("Search Criteria:", searchCriteria);

    // Execute search query
    const articles = await Article.find(searchCriteria)
      .skip(skip)
      .limit(limitNumber);
    const totalArticles = await Article.countDocuments(searchCriteria);

    // Return response
    res.status(200).json({
      totalArticles,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalArticles / limitNumber),
      articles,
    });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({
      message: "An error occurred while searching for articles.",
      error: error.message,
    });
  }
};

// Bulk Upload article

// Function to read Excel file and convert it to JSON
function readExcelFile(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
  return jsonData;
}

// API Endpoint to upload Excel file
const uploadArticle = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = req.file.path;
  const fileExtension = path.extname(filePath);

  if (fileExtension !== ".xlsx" && fileExtension !== ".xls") {
    return res.status(400).json({ message: "Only Excel files are allowed" });
  }

  try {
    const articles = readExcelFile(filePath);

    // Basic validation of the articles
    for (const article of articles) {
      if (
        !article.articleTitle ||
        !article.articleCategory ||
        !article.articleContent
      ) {
        return res.status(400).json({ message: "Invalid article format" });
      }
    }

    await Article.insertMany(articles);
    res.status(200).json({ message: "Articles inserted successfully" });
  } catch (error) {
    console.error("Error inserting articles:", error);
    res.status(500).json({ message: "Error inserting articles", error });
  }
};

// Bulk Download Article
function parseDate(dateStr) {
  return moment(dateStr, "DD-MM-YYYY").toDate();
}
const downloadArticle = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ message: "Start date and end date are required" });
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const articles = await Article.find({
      createdAt: {
        $gte: start,
        $lt: end,
      },
    });

    if (articles.length === 0) {
      return res
        .status(404)
        .json({ message: "No articles found in the specified date range" });
    }

    const data = articles.map((article) => ({
      articleTitle: article.articleTitle,
      articleCategory: article.articleCategory,
      articleContent: article.articleContent,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Articles");

    const filePath = "./downloads/articles.xlsx";
    xlsx.writeFile(workbook, filePath);

    res.download(filePath, "articles.xlsx", async (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        res.status(500).send("Error downloading file");
      } else {
        // Cleanup file after sending
        await unlinkAsync(filePath);
      }
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ message: "Error fetching articles", error });
  }
};
module.exports = {
  createArticle,
  getAllArticles,
  getArticlesByCategory,
  updateArticleById,
  deleteArticleById,
  searchArticles,
  uploadArticle,
  downloadArticle,
  getArticleById,
};
