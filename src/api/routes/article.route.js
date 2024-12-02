const {
  createArticle,
  getAllArticles,
  getArticlesByCategory,
  updateArticleById,
  deleteArticleById,
  searchArticles,
  uploadArticle,
  downloadArticle,
  getArticleById,
} = require("../controllers/article.controller");
const authenticate = require("../middleware/authenticate");
const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });
module.exports = function (app) {
  app.post("/api/office-users/create_article", authenticate, createArticle);
  app.post(
    "/api/office-users/upload_article",
    upload.single("file"),
    uploadArticle
  );
  app.get("/api/office-users/knowledgebase", getAllArticles);
  app.get("/api/office-users/single-kbase", getArticleById);
  app.get("/api/office-users/kbase-category", getArticlesByCategory);
  app.get("/api/office-users/download-article", downloadArticle);
  app.get("/api/office-users/kbase-search", searchArticles);
  app.put("/api/office-users/update-article", updateArticleById);
  app.delete("/api/office-users/delete-article", deleteArticleById);
};
