const mongoose = require("mongoose");

const { Schema } = mongoose;

const statusMasterSchema = new Schema(
  {
    statusName: {
      type: String,
      required: true,
    },
    websiteView: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

const StatusMaster = mongoose.model("StatusMaster", statusMasterSchema);

module.exports = StatusMaster;
