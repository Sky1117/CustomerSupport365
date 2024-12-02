const mongoose = require("mongoose");

const feedback = mongoose.model(
  "feedback",
  new mongoose.Schema(
    {
      ticketId: {
        type: mongoose.Schema.ObjectId,
        ref: "ticket._id",
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      comment: String,
      customerId: {
        type: mongoose.Schema.ObjectId,
        ref: "user",
      },
      assignedTo: {
        type: mongoose.Schema.ObjectId,
        ref: "user",
      },
      parentId: mongoose.Types.ObjectId,
    },
    { timestamps: true }
  )
);

module.exports = feedback;
