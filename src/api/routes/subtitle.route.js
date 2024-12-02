const subtitleController = require("../controllers/subtitle.controller");
const authenticate = require("../middleware/authenticate");

module.exports = function (app) {
  app.post(
    "/api/create-subtitle",
    authenticate,
    subtitleController.createSubtitle
  );
  app.get(
    "/api/get-subtitle",
    authenticate,
    subtitleController.getSubtitleById
  );
  app.get(
    "/api/get-all-subtitles",
    authenticate,
    subtitleController.getAllSubtitles
  );
  app.get(
    "/api/search-subtitles",
    authenticate,
    subtitleController.searchSubtitlesByName
  );
  app.put(
    "/api/update-subtitle",
    authenticate,
    subtitleController.updateSubtitle
  );
  app.delete(
    "/api/delete-subtitle",
    authenticate,
    subtitleController.deleteSubtitle
  );
};
