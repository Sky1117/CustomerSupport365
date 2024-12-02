const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    productName: {
      type: String,
      required: true,
      description: "Name of the product",
    },
    productDescription: {
      type: String,
      required: true,
      description: "Description of the product",
    },
    price: {
      type: Number,
      required: true,
      description: "Price of the product in dollars",
    },
    images: {
      type: [String],
      required: true,
      description: "List of URLs or paths to images of the product",
    },
    isActive: Boolean,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

productSchema.index({ productName: "text", productDescription: "text" });
const Product = mongoose.model("Product", productSchema);

module.exports = Product;
