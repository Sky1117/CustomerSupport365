const roleController = require("../controllers/role.controller");
const authenticate = require("../middleware/authenticate");
module.exports = function (app) {
  app.post("/role", authenticate, roleController.createRole);
  app.get("/api/get-role", roleController.getRoleById);
  app.get("/api/get-all-role", roleController.getAllRoles);
  app.put("/api/update-role", roleController.updateRole);
  app.delete("/api/delete-role", roleController.deleteRole);
  app.post("/api/add-permission", roleController.addPermissionToRole);
  app.post("/api/remove-permission", roleController.removePermissionFromRole);
};
