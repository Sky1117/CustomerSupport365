const {
  createFaq,
  getAllFaq,
  getFaq,
  updateFaq,
  deleteFaq,
  searchFaq,
} = require("../controllers/faq.controller");
const authenticate = require("../middleware/authenticate");
const multer = require("multer");
const upload = multer({
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(pdf|excel|img|video)$/)) {
      return cb(new Error("Only pdf, excel, img, and video files are allowed"));
    }
    cb(null, true);
  },
});
module.exports = function (app) {
  app.post(
    "/api/faq/create",
    upload.array("attachments", 12),
    authenticate,
    createFaq
  );
  app.put("/api/faq/update", upload.array("attachments", 12), updateFaq);
  app.get("/api/faq/find-by-id", getFaq);
  app.get("/api/faq/find-all", getAllFaq);
  app.get("/api/end-users/get-faq", searchFaq);
  app.delete("/api/faq/delete", deleteFaq);
};
