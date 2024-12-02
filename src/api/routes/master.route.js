const {
  addMasterData,
  getMasterDataByName,
} = require("../controllers/master.controller");

module.exports = function (app) {
  app.post("/api/master/add", addMasterData);
  app.get("/api/master/find", getMasterDataByName);
};
