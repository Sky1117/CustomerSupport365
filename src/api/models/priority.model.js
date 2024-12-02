const mongoose = require("mongoose");
const { Schema } = mongoose;

const prioritySchema = new Schema(
  {
    priorityName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "master",
    },
    priorityTimer: {
      type: Number,
    },
    isActive: Boolean,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

const Priority = mongoose.model("Priority", prioritySchema);

module.exports = Priority;
