const Feedback = require("../models/feedback.model");

const feedback = async (req, res) => {
  const createdBy = req.userId;

  try {
    const feedback = new Feedback({
      ticketId: req.body.ticketId,
      rating: req.body.rating,
      comment: req.body.comment,
      customerId: req.body.customerId,
      assignedTo: req.body.assignedTo,
      createdBy: createdBy,
      isActive: req.body.isActive,
    });

    // Validate the rating
    if (
      !Number.isInteger(feedback.rating) ||
      feedback.rating < 1 ||
      feedback.rating > 5
    ) {
      return res
        .status(400)
        .json({ message: "Rating must be an integer between 1 and 5" });
    }

    const savedFeedback = await feedback.save();
    res.status(201).json(savedFeedback);
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((error) => error.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res
      .status(500)
      .json({ message: "An error occurred while saving the feedback" });
  }
};

module.exports = feedback;
