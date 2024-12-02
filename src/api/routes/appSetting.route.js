const emailConfigController = require("../controllers/appSetting.controller");
const authenticate = require("../middleware/authenticate");
module.exports = function (app) {
  app.post("/api/appConfig", emailConfigController.createAppSetting);
  app.put(
    "/api/update-appConfig",
    authenticate,
    emailConfigController.updateAppSetting
  );
  app.get("/api/get-appConfig", emailConfigController.getAppSettingById);
};
