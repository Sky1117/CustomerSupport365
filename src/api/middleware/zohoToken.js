const cron = require("node-cron");
const axios = require("axios");
const {
  getStoredRefreshToken,
  saveAccessTokenToDatabase,
} = require("../controllers/Zoho.controller");

// Function to refresh the token
const refreshAccessToken = async () => {
  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) {
    console.error("No refresh token found in the database.");
    return;
  }

  try {
    const response = await axios.post(process.env.ZOHO_TOKEN_URL, null, {
      params: {
        grant_type: "refresh_token",
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        refresh_token: refreshToken,
      },
    });

    const { access_token, expires_in } = response.data;

    // Save the new access token to the database
    await saveAccessTokenToDatabase(access_token, expires_in);

    console.log("Access token refreshed successfully.");
  } catch (error) {
    console.error("Error refreshing access token:", error.response.data);
  }
};

// Schedule the cron job to run every 45 minutes
const initializeTokenScheduling = () => {
  cron.schedule("*/45 * * * *", async () => {
    console.log("Running cron job to refresh access token...");
    await refreshAccessToken();
  });
};

module.exports = {
  initializeTokenScheduling,
  refreshAccessToken,
};
