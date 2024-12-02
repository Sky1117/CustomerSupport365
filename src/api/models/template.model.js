const mongoose = require("mongoose");
const { Schema } = mongoose;

const templateSchema = new Schema(
  {
    templateType: {
      type: String,
      required: true,
    },
    templateStatusName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StatusMaster",
    },
    templateName: {
      type: String,
      required: true,
    },
    templateDescription: {
      type: String,
      required: true,
    },
    isActive: Boolean,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

const Template = mongoose.model("template", templateSchema);

module.exports = Template;
