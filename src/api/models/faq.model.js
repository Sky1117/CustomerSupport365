const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: "true" },
    answer: { type: String, required: "true" },
    attachments: [
      {
        filename: String,
        contentType: String,
        data: Buffer,
      },
    ],
    category: { type: String, required: "true" },
    parentId: mongoose.Types.ObjectId,
  },
  { timestamps: true }
);
module.exports = mongoose.model("Faq", faqSchema);
