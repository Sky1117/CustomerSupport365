express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
require("./src/config/db.config.js");

// Middleware
const {
  initializeTokenScheduling,
} = require("./src/api/middleware/zohoToken.js");
initializeTokenScheduling();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: "50mb" }));

// routes
require("./src/api/routes/users.route.js")(app);
require("./src/api/routes/feedback.route.js")(app);
require("./src/api/routes/faq.route.js")(app);
require("./src/api/routes/dashboard.route.js")(app);
require("./src/api/routes/endUserRoutes/endUserRoute.js")(app);
require("./src/api/routes/tickets.routes.js")(app);
require("./src/api/routes/ProductRoute/product.route.js")(app);
require("./src/api/routes/brand.route.js")(app);
require("./src/api/routes/article.route.js")(app);
require("./src/api/routes/sla.route.js")(app);
require("./src/api/routes/template.route.js")(app);
require("./src/api/routes/role.route.js")(app);
require("./src/api/routes/permission.route.js")(app);
require("./src/api/routes/subtitle.route.js")(app);
require("./src/api/routes/maintitle.route.js")(app);
require("./src/api/routes/statusMaster.route.js")(app);
require("./src/api/routes/department.route.js")(app);
require("./src/api/routes/adminReply.route.js")(app);
require("./src/api/routes/master.route.js")(app);
require("./src/api/routes/grestLogin.route.js")(app);
require("./src/api/routes/zoho.route.js")(app);
require("./src/api/routes/priority.route.js")(app);
require("./src/api/routes/headerFooter.route.js")(app);
require("./src/api/routes/appSetting.route.js")(app);


if (process.env.ENVIRONMENT !== "lambda") {
  const PORT = process.env.PORT || 7007;

  app.listen(PORT, () => {
    console.log(`Sever running on port: ${PORT}`);
  });
}