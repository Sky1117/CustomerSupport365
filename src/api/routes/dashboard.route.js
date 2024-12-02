const dashboardStatics = require("../controllers/dashboard.controller");
module.exports = function (app) {
  app.get("/api/tickets/dashboard", dashboardStatics);
};
