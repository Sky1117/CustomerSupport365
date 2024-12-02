const {
  createProduct,
  getAllProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  uploadProduct,
  downloadProduct,
  searchProducts,
} = require("../../controllers/product.controller");
const authenticate = require("../../middleware/authenticate");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
module.exports = function (app) {
  app.post("/api/office-users/products", authenticate, createProduct);
  app.post(
    "/api/office-users/upload-products",
    upload.single("file"),
    uploadProduct
  );
  app.put("/api/office-users/edit-product", updateProduct);
  app.get("/api/office-users/find-single-product", getProductById);
  app.get("/api/office-users/find-all-products", getAllProduct);
  app.get("/api/office-users/download-products", downloadProduct);
  app.get("/api/office-users/search-products", searchProducts);
  app.delete("/api/office-users/delete-product", deleteProduct);
};
