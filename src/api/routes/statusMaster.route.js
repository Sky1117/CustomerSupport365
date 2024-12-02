const statusController = require("../controllers/statusMaster.controller");
const authenticate = require("../middleware/authenticate");
module.exports = function (app) {
  app.post("/status", authenticate, statusController.createStatus);
  app.get("/api/get-status", authenticate, statusController.getStatusById);
  app.get("/api/get-all-status", authenticate, statusController.getAllStatuses);
  app.get("/api/search-status", authenticate, statusController.searchStatuses);
  app.put("/api/update-status", authenticate, statusController.updateStatus);
  app.delete("/api/delete-status", authenticate, statusController.deleteStatus);
};
