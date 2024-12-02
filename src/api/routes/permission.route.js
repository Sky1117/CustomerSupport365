const permissionController = require("../controllers/permission.controller");
const authenticate = require("../middleware/authenticate");
module.exports = function (app) {
  app.post(
    "/api/permissions",
    authenticate,
    permissionController.createPermission
  );

  app.get("/api/get-all-permissions", permissionController.getAllPermissions);

  app.get("/api/get-permissions", permissionController.getPermissionById);

  app.put("/api/update-permissions", permissionController.updatePermission);

  app.delete("/api/delete-permissions", permissionController.deletePermission);
};
