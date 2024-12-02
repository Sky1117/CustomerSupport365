const controller = require("../../controllers/users.controller");

module.exports = function (app) {
  app.post("/api/end-user/signup", controller.signup);
  app.post("/api/end-user/signin", controller.signin);
  app.put("/api/end-user/update", controller.update);
  app.get("/api/end-user/find-by-id", controller.findById);
  app.delete("/api/end-user/delete-by-id", controller.deleteById);
  app.get("/api/end-user/find-all", controller.findAll);
  app.post("/api/end-user/reset_password", controller.reset_password);
  app.post("/api/end-user/forgotPassword", controller.forgotPassword);
  app.get("/api/end-user/verify", controller.verifymail);
};
