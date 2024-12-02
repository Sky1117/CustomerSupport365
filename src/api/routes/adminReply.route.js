const adminReplyController = require("../controllers/adminReply.controller");
const authenticate = require("../middleware/authenticate");

module.exports = function (app) {
  app.post("/admin-reply", authenticate, adminReplyController.createAdminReply);
  app.get("/api/get-admin-reply", adminReplyController.getAdminReplyById);
  app.get("/api/get-all-admin-reply", adminReplyController.getAllAdminReplies);
  app.get(
    "/api/get-all-admin-ticket-reply",
    authenticate,
    adminReplyController.getAllAdminRepliesByTicketId
  );
  app.get(
    "/api/get-all-reply-customer",
    authenticate,
    adminReplyController.getAllRepliesToCustomerByTicketId
  );

  app.get("/api/getFirstReplyTime", adminReplyController.getFirstReplyTime);
  app.get(
    "/api/getTicketsByPlatform",
    adminReplyController.getTicketsByPlatform
  );
  app.get(
    "/api/getTicketResolveTime",
    adminReplyController.getTicketResolveTime
  );
  app.put("/api/update-admin-reply", adminReplyController.updateAdminReply);
  app.delete("/api/delete-admin-reply", adminReplyController.deleteAdminReply);
};
