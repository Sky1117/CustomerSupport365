const mainTitleController = require("../controllers/maintitle.controller");
const authenticate = require("../middleware/authenticate");

module.exports = function (app) {
  app.post(
    "/api/create-maintitle",
    authenticate,
    mainTitleController.createMainTitle
  );
  app.get(
    "/api/get-maintitle",
    authenticate,
    mainTitleController.getMainTitleById
  );
  app.get(
    "/api/get-all-maintitles",
    authenticate,
    mainTitleController.getAllMainTitles
  );
  app.get(
    "/api/get-search-maintitles",
    authenticate,
    mainTitleController.searchMainTitles
  );
  app.put(
    "/api/update-maintitle",
    authenticate,
    mainTitleController.updateMainTitle
  );
  app.delete(
    "/api/delete-maintitle",
    authenticate,
    mainTitleController.deleteMainTitle
  );
};
