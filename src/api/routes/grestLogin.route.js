const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/grestLogin.controller");
const upload = require("../middleware/upload"); // Adjust path as needed

module.exports = function (app) {
  app.post("/api/create-grest-user", upload.single("profilePhoto"), createUser);
  app.get("/api/grest-login", getUserById);
  app.put("/api/update-grest-user", upload.single("profilePhoto"), updateUser);
};
