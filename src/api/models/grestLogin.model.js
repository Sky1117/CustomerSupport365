const mongoose = require("mongoose");

const grestUserSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    userName: { type: String },
    email: { type: String },
    profilePhoto: { type: String },
    address: {
      addressLine1: String,
      addressLine2: String,
      landmark: String,
      pincode: String,
      city: String,
      state: String,
    },
    shopifyId: {
      type: Number,
      required: true,
    },
    phoneNumber: {
      type: Number,
    },
    token: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const GrestUser = mongoose.model("GrestUser", grestUserSchema);

module.exports = GrestUser;
