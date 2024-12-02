const mongoose = require("mongoose");
const { Schema } = mongoose;

const slaSchema = new Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DepartmentMaster",
    },
    level_1_FRT: {
      type: Number,
      required: true,
    },
    level_2_FRT: {
      type: Number,
      required: true,
    },
    level_3_FRT: {
      type: Number,
      required: true,
    },
    level_4_FRT: {
      type: Number,
      required: true,
    },
    ticketActionTimeout: {
      type: Number,
      required: true,
    },
    isActive: Boolean,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

const SLA = mongoose.model("SLA", slaSchema);

module.exports = SLA;
