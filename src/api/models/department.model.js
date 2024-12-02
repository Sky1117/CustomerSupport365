const mongoose = require("mongoose");

const { Schema } = mongoose;

const departmentMasterSchema = new Schema(
  {
    departmentName: {
      type: String,
      required: true,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
    level1: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        name: String,
        email: String,
      },
    ],
    level2: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        name: String,
        email: String,
      },
    ],
    level3: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        name: String,
        email: String,
      },
    ],
    level4: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        name: String,
        email: String,
      },
    ],
    isActive: {
      type: Boolean,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

const DepartmentMaster = mongoose.model(
  "DepartmentMaster",
  departmentMasterSchema
);

module.exports = DepartmentMaster;
