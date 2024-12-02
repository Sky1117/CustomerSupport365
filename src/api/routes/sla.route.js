const {
  createSLA,
  getAllSLAs,
  getSLAById,
  getSLAByDepartmentId,
  updateSLA,
  deleteSLA,
  getTicketActionTimeoutByUserId,
} = require("../controllers/sla.controller");
const authenticate = require("../middleware/authenticate");
module.exports = function (app) {
  app.post("/api/admin-users/create-sla", authenticate, createSLA);
  app.get("/api/admin-users/get-sla", getSLAById);
  app.get(
    "/api/admin-users/get-tat",
    authenticate,
    getTicketActionTimeoutByUserId
  );
  app.get("/api/admin-users/get-sla-byDepartment", getSLAByDepartmentId);
  app.get("/api/admin-users/get-all-sla", getAllSLAs);
  app.put("/api/admin-users/edit-sla", updateSLA);
  app.delete("/api/admin-users/delete-sla", deleteSLA);
};
