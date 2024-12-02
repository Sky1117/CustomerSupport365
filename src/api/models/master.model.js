const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define call log schema
const masterSchema = new Schema(
  {
    code: String,
    key: String,
    value: String,
    parentId: mongoose.Types.ObjectId,
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const master = mongoose.model("master", masterSchema);

module.exports = master;
