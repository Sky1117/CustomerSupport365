const mongoose = require("mongoose");

const user = mongoose.model(
  "user",
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
      },
      phoneNumber: String,
      password: {
        type: String,
        required: true,
      },
      address: {
        type: String,
      },
      slug: {
        type: String,
      },
      role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
      permission: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
      status: {
        type: Boolean,
        default: true,
      },
      profilePhoto: {
        Type: String,
      },
      userId: {
        type: String,
      },
      shopifyId: {
        type: Number,
      },
      grestUserName: { type: String },
      token: {
        type: String,
        default: "",
      },
      is_verified: {
        type: Number,
        default: 0,
      },
      ticketAssigned: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Ticket",
        },
      ],
      parentId: mongoose.Types.ObjectId,
    },
    { timestamps: true }
  )
);

module.exports = user;
