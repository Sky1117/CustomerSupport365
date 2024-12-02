const mongoose = require("mongoose");

const { Schema } = mongoose;

const subtitleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    websiteView: {
      type: Boolean,
      default: true,
    },
    index: Number,
    isActive: Boolean,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

const SubTitle = mongoose.model("SubTitle", subtitleSchema);

module.exports = SubTitle;
