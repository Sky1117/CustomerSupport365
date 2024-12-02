const mongoose = require("mongoose");

const adminReplySchema = new mongoose.Schema(
  {
    input: {
      type: String,
      required: true,
    },
    attachments: [String],
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
    },
    replyTo: {
      type: String,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);
module.exports = mongoose.model("adminReply", adminReplySchema);
