const PriorityController = require("../controllers/priority.controller");
const authenticate = require("../middleware/authenticate");
module.exports = function (app) {
  app.post(
    "/api/create-priority",
    authenticate,
    PriorityController.createPriority
  );
  app.get("/api/get-priority", PriorityController.getPriorityById);
  app.get("/api/get-all-priority", PriorityController.getAllPriorities);
  app.put("/api/update-priority", PriorityController.updatePriority);
  app.delete("/api/delete-priority", PriorityController.deletePriority);
};
