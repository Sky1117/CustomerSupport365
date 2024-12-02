const Faq = require("../models/faq.model");

// Create FAQ
const createFaq = async (req, res) => {
  try {
    const { question, answer, category, parentId, isActive } = req.body;
    const createdBy = req.userId;
    const attachments = req.files.map((file) => ({
      filename: file.originalname,
      contentType: file.mimetype,
      data: file.buffer,
    }));
    const faq = new Faq({
      question,
      answer,
      attachments,
      category,
      parentId,
      isActive,
      createdBy,
    });
    await faq.save();
    res.send(faq);
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: error.message });
  }
};

// Get all FAQs
const getAllFaq = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch FAQs with pagination
    const faqs = await Faq.find().skip(skip).limit(limitNumber).exec();
    const totalFaqs = await Faq.countDocuments();

    res.status(200).json({
      totalFaqs,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalFaqs / limitNumber),
      faqs,
    });
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: "Error fetching FAQs" });
  }
};

// Get FAQ by ID
const getFaq = async (req, res) => {
  try {
    const faq = await Faq.findById(req.query.id).exec();
    if (!faq) {
      res.status(404).send({ message: "FAQ not found" });
    } else {
      res.send(faq);
    }
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: "Error fetching FAQ" });
  }
};

// Update FAQ
const updateFaq = async (req, res) => {
  try {
    const { question, answer, category, parentId } = req.body;
    const attachments = req.files.map((file) => ({
      filename: file.originalname,
      contentType: file.mimetype,
      data: file.buffer,
    }));
    const faq = await Faq.findByIdAndUpdate(
      req.query.id,
      {
        question,
        answer,
        attachments,
        category,
        parentId,
      },
      { new: true }
    ).exec();
    res.send(faq);
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: "Error updating FAQ" });
  }
};

// Delete FAQ
const deleteFaq = async (req, res) => {
  try {
    await Faq.findByIdAndDelete(req.query.id).exec();
    res.send({ message: "FAQ deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: "Error deleting FAQ" });
  }
};

// Search FAQ by Keywords
const searchFaq = async (req, res) => {
  try {
    const { keyword } = req.query;
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build the search criteria
    const searchCriteria = {
      $or: [
        { question: { $regex: keyword, $options: "i" } },
        { answer: { $regex: keyword, $options: "i" } },
      ],
    };

    // Perform the search with pagination
    const faqs = await Faq.find(searchCriteria)
      .skip(skip)
      .limit(limitNumber)
      .exec();
    const totalFaqs = await Faq.countDocuments(searchCriteria);

    res.status(200).json({
      totalFaqs,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalFaqs / limitNumber),
      faqs,
    });
  } catch (error) {
    res.status(400).send({ message: "Error searching FAQs" });
  }
};

module.exports = {
  createFaq,
  getAllFaq,
  getFaq,
  updateFaq,
  deleteFaq,
  searchFaq,
};
