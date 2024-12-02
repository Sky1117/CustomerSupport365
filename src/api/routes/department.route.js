const departmentController = require("../controllers/department.controller");
const authenticate = require("../middleware/authenticate");
module.exports = function (app) {
  app.post("/department", authenticate, departmentController.createDepartment);
  app.get(
    "/api/get-department",
    authenticate,
    departmentController.getDepartmentById
  );
  app.get(
    "/api/get-all-department",
    authenticate,
    departmentController.getDepartments
  );
  app.get(
    "/api/search-department",
    authenticate,
    departmentController.searchDepartments
  );
  app.put(
    "/api/update-department",
    authenticate,
    departmentController.updateDepartment
  );
  app.delete(
    "/api/delete-department",
    authenticate,
    departmentController.deleteDepartment
  );
};
