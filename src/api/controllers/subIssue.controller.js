const SubIssue = require("../models/subIssue.model");

// Create a new SubIssue
const createSubIssue = async (req, res) => {
  const { name, isActive } = req.body;
  const createdBy = req.userId; // Assuming userId is set in req by the authentication middleware

  // Basic validation
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ message: "Invalid name provided" });
  }

  if (!createdBy || !mongoose.Types.ObjectId.isValid(createdBy)) {
    return res.status(400).json({ message: "Invalid createdBy user ID" });
  }

  try {
    const newSubIssue = new SubIssue({ name, isActive, createdBy });
    const savedSubIssue = await newSubIssue.save();
    res.status(201).json(savedSubIssue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all SubIssues
const getAllSubIssues = async (req, res) => {
  try {
    const subIssues = await SubIssue.find().populate("createdBy", "name"); // Populate createdBy field with user name
    res.status(200).json(subIssues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a SubIssue by ID
const getSubIssueById = async (req, res) => {
  const { id } = req.query;

  try {
    const subIssue = await SubIssue.findById(id).populate("createdBy", "name");

    if (!subIssue) {
      return res.status(404).json({ message: "SubIssue not found" });
    }

    res.status(200).json(subIssue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a SubIssue by ID
const updateSubIssue = async (req, res) => {
  const { id } = req.query;
  const { name } = req.body;

  // Basic validation
  if (name && (typeof name !== "string" || name.trim().length === 0)) {
    return res.status(400).json({ message: "Invalid name provided" });
  }

  try {
    const updatedSubIssue = await SubIssue.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    ).populate("createdBy", "name");

    if (!updatedSubIssue) {
      return res.status(404).json({ message: "SubIssue not found" });
    }

    res.status(200).json(updatedSubIssue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a SubIssue by ID
const deleteSubIssue = async (req, res) => {
  const { id } = req.query;

  try {
    const deletedSubIssue = await SubIssue.findByIdAndDelete(id);

    if (!deletedSubIssue) {
      return res.status(404).json({ message: "SubIssue not found" });
    }

    res.status(200).json({ message: "SubIssue deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSubIssue,
  getAllSubIssues,
  getSubIssueById,
  updateSubIssue,
  deleteSubIssue,
};
