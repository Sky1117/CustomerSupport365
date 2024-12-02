const mongoose = require("mongoose");

const { Schema } = mongoose;

const brandSchema = new Schema(
  {
    Brand: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Products = mongoose.model("Brand", brandSchema);

module.exports = Products;
