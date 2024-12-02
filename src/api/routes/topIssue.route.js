const topIssueController = require("../controllers/topIssue.controller");
const authenticate = require("../middleware/authenticate");

module.exports = function (app) {
  app.post(
    "/api/create-topissue",
    authenticate,
    topIssueController.createTopIssue
  );
  app.get(
    "/api/get-topissue/:id",
    authenticate,
    topIssueController.getTopIssueById
  );
  app.get(
    "/api/get-all-topissues",
    authenticate,
    topIssueController.getAllTopIssues
  );
  app.put(
    "/api/update-topissue/:id",
    authenticate,
    topIssueController.updateTopIssue
  );
  app.delete(
    "/api/delete-topissue/:id",
    authenticate,
    topIssueController.deleteTopIssue
  );
};
