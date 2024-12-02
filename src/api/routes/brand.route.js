const {
  createbrand,
  getAllbrands,
  getbrandById,
  updatebrandById,
  deletebrandById,
  getBrandReport,
  uploadBrand,
  searchBrands,
} = require("../controllers/brand.controller");
const authenticate = require("../middleware/authenticate");
const parseDates = (req, res, next) => {
  const { startDate, endDate } = req.query;
  req.startDate = new Date(startDate);
  req.endDate = new Date(endDate);
  next();
};
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
module.exports = function (app) {
  app.post("/api/office-users/create-brand", authenticate, createbrand);
  app.get("/api/office-users/brands", getAllbrands);
  app.get("/api/office-users/report-brands", parseDates, getBrandReport);
  app.post(
    "/api/office-users/upload-brand",
    upload.single("file"),
    uploadBrand
  );
  app.get("/api/office-users/get-brands", getbrandById);
  app.get("/api/office-users/search-brands", searchBrands);
  app.put("/api/office-users/update-brands", updatebrandById);
  app.delete("/api/office-users/delete-brands", deletebrandById);
};
