const AppSetting = require("../models/appSetting.model");

// Create a new email configuration
const createAppSetting = async (req, res) => {
  try {
    const {
      senderEmail,
      replyToEmail,
      senderName,
      testEmail,
      smtpServer,
      encryptionMethod,
      smtpPort,
      authentication,
      username,
      password,
      host,
      port,
      secure,
    } = req.body;

    const emailConfig = new AppSetting({
      senderEmail,
      replyToEmail,
      senderName,
      testEmail,
      smtpServer,
      encryptionMethod,
      smtpPort,
      authentication,
      username,
      password,
      host,
      port,
      secure,
    });

    await emailConfig.save();
    res.status(201).json({
      message: "Email configuration created successfully",
      emailConfig,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update existing email configuration
const updateAppSetting = async (req, res) => {
  const createdBy = req.userId;
  try {
    const {
      senderEmail,
      replyToEmail,
      senderName,
      testEmail,
      smtpServer,
      encryptionMethod,
      smtpPort,
      authentication,
      username,
      password,
      host,
      port,
      secure,
    } = req.body;
    const emailConfig = await AppSetting.findById(req.body.id);

    if (!emailConfig) {
      return res.status(404).json({ message: "Email configuration not found" });
    }
    emailConfig.createdBy = createdBy;
    emailConfig.senderEmail = senderEmail || emailConfig.senderEmail;
    emailConfig.replyToEmail = replyToEmail || emailConfig.replyToEmail;
    emailConfig.senderName = senderName || emailConfig.senderName;
    emailConfig.testEmail = testEmail || emailConfig.testEmail;
    emailConfig.smtpServer = smtpServer || emailConfig.smtpServer;
    emailConfig.encryptionMethod =
      encryptionMethod || emailConfig.encryptionMethod;
    emailConfig.smtpPort = smtpPort || emailConfig.smtpPort;
    emailConfig.authentication =
      authentication !== undefined
        ? authentication
        : emailConfig.authentication;
    emailConfig.username = username || emailConfig.username;
    if (password) {
      emailConfig.password = password;
    }
    emailConfig.host = host || emailConfig.host;
    emailConfig.port = port || emailConfig.port;
    emailConfig.secure = secure !== undefined ? secure : emailConfig.secure;

    await emailConfig.save();
    res.status(200).json({
      message: "Email configuration updated successfully",
      emailConfig,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAppSettingById = async (req, res) => {
  try {
    const { id } = req.query;
    const emailConfig = await AppSetting.findById(id);

    if (!emailConfig) {
      return res.status(404).json({ message: "Email configuration not found" });
    }

    res.status(200).json({
      senderEmail: emailConfig.senderEmail,
      replyToEmail: emailConfig.replyToEmail,
      senderName: emailConfig.senderName,
      testEmail: emailConfig.testEmail,
      smtpServer: emailConfig.smtpServer,
      encryptionMethod: emailConfig.encryptionMethod,
      smtpPort: emailConfig.smtpPort,
      authentication: emailConfig.authentication,
      username: emailConfig.username,
      password: emailConfig.password,
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createAppSetting,
  updateAppSetting,
  getAppSettingById,
};
