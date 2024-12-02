const mongoose = require("mongoose");

const { Schema } = mongoose;

const subIssueSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    isActive: Boolean,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

const SubIssue = mongoose.model("SubIssue", subIssueSchema);

module.exports = SubIssue;
