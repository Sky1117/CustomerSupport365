const axios = require("axios");
const {
  saveTokensToDatabase,
  getStoredAccessToken,
  getStoredRefreshToken,
  saveAccessTokenToDatabase,
} = require("../controllers/Zoho.controller");

module.exports = function (app) {
  app.get("/api/auth/zoho", (req, res) => {
    const authUrl = `${process.env.ZOHO_AUTH_URL}?response_type=code&client_id=${process.env.ZOHO_CLIENT_ID}&redirect_uri=${process.env.ZOHO_REDIRECT_URI}&scope=${process.env.ZOHO_SCOPES}&access_type=offline`;
    res.redirect(authUrl);
  });

  app.get("/api/callback", async (req, res) => {
    const authorizationCode = req.query.code;
    try {
      const tokenResponse = await axios.post(process.env.ZOHO_TOKEN_URL, null, {
        params: {
          grant_type: "authorization_code",
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          redirect_uri: process.env.ZOHO_REDIRECT_URI,
          code: authorizationCode,
        },
      });

      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      console.log(tokenResponse);
      console.log(access_token);
      console.log(refresh_token);
      console.log(expires_in);
      // Save tokens to the database
      if (refresh_token) {
        await saveTokensToDatabase(access_token, refresh_token, expires_in);
      } else {
        await saveTokensToDatabase(access_token, "refresh_token", expires_in);
      }

      res.json({
        message: "Successfully authenticated with Zoho!",
        access_token,
        refresh_token,
      });
    } catch (error) {
      console.log("Error exchanging authorization code for token:", error);
      res.status(500).json({ error: "Failed to authenticate with Zoho" });
    }
  });

  // Get items with pagination
  app.get("/api/books/items", async (req, res) => {
    const accessToken = await getStoredAccessToken();
    const { page = 1, per_page = 200 } = req.query; // Default to page 1, 20 items per page

    try {
      const response = await axios.get(`${process.env.ZOHO_API_URL}/items`, {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
        params: {
          page,
          per_page,
        },
      });
      res.json(response.data);
    } catch (error) {
      console.error("Error accessing Zoho Inventory:", error.response?.data);
      res.status(500).json({ error: "Failed to access Zoho Inventory" });
    }
  });

  // Get invoices with pagination
  app.get("/api/books/invoices", async (req, res) => {
    const accessToken = await getStoredAccessToken();
    const { page = 1, per_page = 200 } = req.query; // Default to page 1, 20 items per page

    try {
      const response = await axios.get(`${process.env.ZOHO_API_URL}/invoices`, {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
        params: {
          page,
          per_page,
        },
      });
      res.json(response.data);
    } catch (error) {
      console.error("Error accessing Zoho Inventory:", error.response?.data);
      res.status(500).json({ error: "Failed to access Zoho Inventory" });
    }
  });

  app.get("/api/books/invoices/searchByInvoiceNumber", async (req, res) => {
    const accessToken = await getStoredAccessToken();
    const { invoice_number } = req.query;

    console.log(invoice_number, "this is your invoice_number");

    if (!invoice_number) {
      return res.status(400).json({ error: "invoice_number is required" });
    }

    try {
      // Use the search endpoint with the 'invoice_number' parameter
      const response = await axios.get(`${process.env.ZOHO_API_URL}/invoices`, {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
        params: {
          invoice_number, // Search parameter for Zoho API
        },
      });

      res.json(response.data);
    } catch (error) {
      console.error(
        "Error fetching invoice by invoice_number:",
        error.response?.data || error.message
      );
      res
        .status(500)
        .json({ error: "Failed to fetch invoice by invoice_number" });
    }
  });

  app.get("/api/inventory/items/search", async (req, res) => {
    const accessToken = await getStoredAccessToken();
    const customFieldId = req.query.customFieldId;
    const customFieldValue = req.query.customFieldValue;

    try {
      const response = await axios.get(`${process.env.ZOHO_API_URL}/items`, {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
        params: {
          [`cf_${customFieldId}`]: customFieldValue,
        },
      });

      res.json(response.data);
    } catch (error) {
      console.error(
        "Error fetching item by custom field:",
        error.response ? error.response.data : error.message
      );
      res.status(500).json({ error: "Failed to fetch item by custom field" });
    }
  });

  // Search by Id
  app.get("/api/books/items/searchById", async (req, res) => {
    const accessToken = await getStoredAccessToken();
    const { item_id } = req.query; // Get item_id from query parameters
    console.log(item_id, "this is your id");
    if (!item_id) {
      return res.status(400).json({ error: "item_id is required" });
    }

    try {
      const response = await axios.get(
        `${process.env.ZOHO_API_URL}/items/${item_id}`,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
          },
        }
      );

      res.json(response.data);
    } catch (error) {
      console.error(
        "Error fetching item by item_id:",
        error.response?.data || error.message
      );
      res.status(500).json({ error: "Failed to fetch item by item_id" });
    }
  });

  app.get("/api/books/items/searchByName", async (req, res) => {
    const accessToken = await getStoredAccessToken();
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ error: "Item name is required" });
    }

    try {
      const response = await axios.get(`${process.env.ZOHO_API_URL}/items`, {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
        params: {
          name,
        },
      });

      res.json(response.data);
    } catch (error) {
      console.error(
        "Error fetching item by name:",
        error.response?.data || error.message
      );
      res.status(500).json({ error: "Failed to fetch item by name" });
    }
  });

  app.get("/api/refresh-token", async (req, res) => {
    const refreshToken = await getStoredRefreshToken();

    try {
      const response = await axios.post(process.env.ZOHO_TOKEN_URL, null, {
        params: {
          grant_type: "refresh_token",
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          refresh_token: refreshToken,
        },
      });
      console.log(response.data);
      const { access_token, expires_in } = response.data;

      // Save the new access token to the database
      await saveAccessTokenToDatabase(access_token, expires_in);

      res.json({ access_token });
    } catch (error) {
      console.error("Error refreshing access token:", error.response.data);
      res.status(500).json({ error: "Failed to refresh access token" });
    }
  });
};
