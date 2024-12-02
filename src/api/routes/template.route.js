const {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  searchTemplates,
  uploadTemplate,
  downloadTemplates,
} = require("../controllers/template.controller");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const authenticate = require("../middleware/authenticate");
// Function to parse dd/mm/yyyy format to Date object
const parseDate = (dateStr) => {
  const [day, month, year] = dateStr.split("/");
  return new Date(`${year}-${month}-${day}`);
};

// Middleware to parse and validate startDate and endDate
const parseDates = (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ message: "startDate and endDate are required" });
  }

  req.startDate = parseDate(startDate);
  req.endDate = parseDate(endDate);

  if (isNaN(req.startDate.getTime()) || isNaN(req.endDate.getTime())) {
    return res
      .status(400)
      .json({ message: "Invalid date format. Use dd/mm/yyyy." });
  }

  next();
};
module.exports = function (app) {
  app.post("/api/create-template", authenticate, createTemplate);
  app.post("/api/upload-templates", upload.single("file"), uploadTemplate);
  app.get("/api/get-templates", getTemplates);
  app.get("/api/get-all-templated", getTemplateById);
  app.get("/api/search-template", searchTemplates);
  app.get("/api/download-template", parseDates, downloadTemplates);
  app.put("/api/update-template", updateTemplate);
  app.delete("/api/delete-template", deleteTemplate);
};
