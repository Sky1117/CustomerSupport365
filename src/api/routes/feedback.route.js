const ticketFeedback = require("../controllers/feeback.controller");
const authenticate = require("../middleware/authenticate");
module.exports = function (app) {
  app.post("/api/ticket/feedback", authenticate, ticketFeedback);
};
