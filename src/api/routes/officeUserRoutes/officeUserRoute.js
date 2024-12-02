const controller = require("../../controllers/users.controller");

module.exports = function (app) {
  app.post("/api/office-users/sign-in", controller.signin);
  app.put("/api/office-users/edit-profile", controller.update);
  app.post("/api/end-user/reset_password", controller.reset_password);
  app.post("/api/end-user/forgotPassword", controller.forgotPassword);
};
