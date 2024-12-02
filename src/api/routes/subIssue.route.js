const subIssueController = require("../controllers/subIssue.controller");
const authenticate = require("../middleware/authenticate");

module.exports = function (app) {
  app.post(
    "/api/create-subissue",
    authenticate,
    subIssueController.createSubIssue
  );
  app.get(
    "/api/get-subissue",
    authenticate,
    subIssueController.getSubIssueById
  );
  app.get(
    "/api/get-all-subissues",
    authenticate,
    subIssueController.getAllSubIssues
  );
  app.put(
    "/api/update-subissue",
    authenticate,
    subIssueController.updateSubIssue
  );
  app.delete(
    "/api/delete-subissue",
    authenticate,
    subIssueController.deleteSubIssue
  );
};
