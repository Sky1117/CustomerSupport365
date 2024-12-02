const mongoose = require("mongoose");

const { Schema } = mongoose;

const maintitleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    subTitle: [
      {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "SubTitle" },
      },
    ],
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

const MainTitle = mongoose.model("MainTitle", maintitleSchema);

module.exports = MainTitle;
