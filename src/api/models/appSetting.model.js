const mongoose = require("mongoose");

const appsettingSchema = new mongoose.Schema(
  {
    senderEmail: {
      type: String,
    },
    replyToEmail: {
      type: String,
    },
    senderName: {
      type: String,
    },
    testEmail: {
      type: String,
    },
    smtpServer: {
      type: String,
    },
    encryptionMethod: {
      type: String,
    },
    smtpPort: {
      type: String,
    },
    authentication: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    host: {
      type: String,
    },
    port: {
      type: Number,
    },
    secure: {
      type: Boolean,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

const AppSetting = mongoose.model("AppSetting", appsettingSchema);

module.exports = AppSetting;
