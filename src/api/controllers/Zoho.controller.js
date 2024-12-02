const Token = require("../models/zoho.model");

// Save tokens to the database
const saveTokensToDatabase = async (accessToken, refreshToken, expiresIn) => {
  const expiresAt = new Date(Date.now() + expiresIn * 1000); // Calculate expiration time
  const token = new Token({
    accessToken,
    refreshToken,
    expiresAt,
  });
  await token.save();
};

// Retrieve stored access token
const getStoredAccessToken = async () => {
  const token = await Token.findOne({});
  return token ? token.accessToken : null;
};

// Retrieve stored refresh token
const getStoredRefreshToken = async () => {
  const token = await Token.findOne({});
  return token ? token.refreshToken : null;
};

// Save new access token to the database
const saveAccessTokenToDatabase = async (newAccessToken, expiresIn) => {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  await Token.updateOne({}, { accessToken: newAccessToken, expiresAt });
};

const getStoredExpirationTime = async () => {
  const token = await Token.findOne({});
  return token ? token.expiresAt : null;
};

module.exports = {
  saveTokensToDatabase,
  getStoredAccessToken,
  getStoredRefreshToken,
  saveAccessTokenToDatabase,
  getStoredExpirationTime,
};
