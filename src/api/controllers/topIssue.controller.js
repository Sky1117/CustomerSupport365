const TopIssue = require("../models/topissue.model");
const mongoose = require("mongoose");

// Create a new TopIssue
const createTopIssue = async (req, res) => {
  const { name, subIssue, index, isActive } = req.body;
  const createdBy = req.userId;

  // Basic validation
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ message: "Invalid name provided" });
  }

  if (!createdBy || !mongoose.Types.ObjectId.isValid(createdBy)) {
    return res.status(400).json({ message: "Invalid createdBy user ID" });
  }

  try {
    const newTopIssue = new TopIssue({
      name,
      subIssue,
      index,
      isActive,
      createdBy,
    });
    const savedTopIssue = await newTopIssue.save();
    res.status(201).json(savedTopIssue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all TopIssues
const getAllTopIssues = async (req, res) => {
  try {
    const topIssues = await TopIssue.find()
      .populate("subIssue.id")
      .populate("createdBy", "name"); // Populate subIssue and createdBy fields
    res.status(200).json(topIssues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a TopIssue by ID
const getTopIssueById = async (req, res) => {
  const { id } = req.query;

  try {
    const topIssue = await TopIssue.findById(id)
      .populate("subIssue.id")
      .populate("createdBy", "name");

    if (!topIssue) {
      return res.status(404).json({ message: "TopIssue not found" });
    }

    res.status(200).json(topIssue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a TopIssue by ID
const updateTopIssue = async (req, res) => {
  const { id } = req.query;
  const { name, subIssue, index, isActive } = req.body;

  // Basic validation
  if (name && (typeof name !== "string" || name.trim().length === 0)) {
    return res.status(400).json({ message: "Invalid name provided" });
  }

  try {
    const updatedTopIssue = await TopIssue.findByIdAndUpdate(
      id,
      { name, subIssue, index, isActive },
      { new: true }
    )
      .populate("subIssue.id")
      .populate("createdBy", "name");

    if (!updatedTopIssue) {
      return res.status(404).json({ message: "TopIssue not found" });
    }

    res.status(200).json(updatedTopIssue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a TopIssue by ID
const deleteTopIssue = async (req, res) => {
  const { id } = req.query;

  try {
    const deletedTopIssue = await TopIssue.findByIdAndDelete(id);

    if (!deletedTopIssue) {
      return res.status(404).json({ message: "TopIssue not found" });
    }

    res.status(200).json({ message: "TopIssue deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTopIssue,
  getAllTopIssues,
  getTopIssueById,
  updateTopIssue,
  deleteTopIssue,
};
