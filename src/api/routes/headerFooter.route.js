const headerFooterController = require("../controllers/headerFooter.controller");
const authenticate = require("../middleware/authenticate");

module.exports = function (app) {
  app.post(
    "/api/create-headerfooter",
    authenticate,
    headerFooterController.createHeaderFooter
  );
  app.get("/api/get-headerfooter", headerFooterController.getHeaderFooterById);
  app.get(
    "/api/get-all-headerfooter",
    headerFooterController.getAllHeaderFooters
  );
  app.put(
    "/api/update-headerfooter",
    headerFooterController.updateHeaderFooter
  );
  app.delete(
    "/api/delete-headerfooter",
    headerFooterController.deleteHeaderFooter
  );
};
