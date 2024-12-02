const controller = require("../controllers/users.controller");
const multer = require("multer");

const parseDates = (req, res, next) => {
  const { startDate, endDate } = req.query;
  req.startDate = new Date(startDate);
  req.endDate = new Date(endDate);
  next();
};
const upload = multer({ dest: "./uploads/" });
module.exports = function (app) {
  app.post("/api/users/create", controller.signup);
  app.post(
    "/api/users/upload-users",
    upload.single("file"),
    controller.uploadUsers
  );
  app.post("/api/users/signin", controller.signin);
  app.post("/api/users/assign-ticket", controller.assignTicketsToUser);
  app.put(
    "/api/users/update",
    upload.single("profilePhoto"),
    controller.update
  );
  app.get("/api/users/find-by-id", controller.findById);
  app.delete("/api/users/delete-by-id", controller.deleteById);
  app.get("/api/users/find-all", controller.findAll);
  app.get(
    "/api/admin-users/bulk-report-users",
    parseDates,
    controller.getUserReport
  );
  app.get("/api/admin-users/users", controller.getUser);
  app.post("/api/users/reset_password", controller.reset_password);
  app.post("/api/users/forgotPassword", controller.forgotPassword);
  app.post("/api/users/updatePassword", controller.changePassword);
  app.get("/verify", controller.verifymail);
  app.post(
    "/api/create-grest-user",
    upload.single("profilePhoto"),
    controller.createGrestUser
  );
  app.get("/api/grest-login", controller.getGrestUserById);
};
