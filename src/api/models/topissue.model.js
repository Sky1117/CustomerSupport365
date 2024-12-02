const mongoose = require("mongoose");

const { Schema } = mongoose;

const topIssueSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    subIssue: [
      {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "SubIssue" },
        index: Number,
        isActive: Boolean,
      },
    ],
    index: Number,
    isActive: Boolean,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

const TopIssue = mongoose.model("TopIssue", topIssueSchema);

module.exports = TopIssue;
