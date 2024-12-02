const mongoose = require("mongoose");
const { Schema } = mongoose;

const headerFooterSchema = new Schema(
  {
    header: {
      type: String,
      required: true,
    },
    footer: {
      type: String,
      required: true,
    },
    isActive: Boolean,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

const HeaderFooters = mongoose.model("HeaderFooter", headerFooterSchema);

module.exports = HeaderFooters;
