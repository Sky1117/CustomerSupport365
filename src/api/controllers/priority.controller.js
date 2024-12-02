const Priority = require("../models/priority.model");
const mongoose = require("mongoose");

// Validation function
const validatePriority = (body) => {
  const errors = [];
  if (!body.priorityName) {
    errors.push("Priority name is required");
  } else if (!mongoose.Types.ObjectId.isValid(body.priorityName)) {
    errors.push("Invalid priorityName ID");
  }
  if (body.priorityTimer === undefined || body.priorityTimer === null) {
    errors.push("priorityTimer is required");
  } else if (body.priorityTimer < 1) {
    errors.push("priorityTimer must be a positive integer");
  }
  return errors;
};

// Create a new priority
const createPriority = async (req, res) => {
  try {
    const errors = validatePriority(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const { priorityName, priorityTimer, isActive } = req.body;
    const createdBy = req.userId;
    const newPriority = new Priority({
      priorityName,
      priorityTimer,
      isActive,
      createdBy,
    });
    const savedPriority = await newPriority.save();
    res.status(201).json(savedPriority);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all priorities
const getAllPriorities = async (req, res) => {
  try {
    const priorities = await Priority.find().populate("priorityName","value");
    res.status(200).json(priorities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single priority by ID
const getPriorityById = async (req, res) => {
  try {
    const priority = await Priority.findById(req.query.id).populate(
      "priorityName createdBy"
    );
    if (!priority) {
      return res.status(404).json({ message: "Priority not found" });
    }
    res.status(200).json(priority);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a priority
const updatePriority = async (req, res) => {
  try {
    const errors = validatePriority(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const { priorityName, priorityTimer, isActive } = req.body;
    const updatedPriority = await Priority.findByIdAndUpdate(
      req.query.id,
      { priorityName, priorityTimer, isActive },
      { new: true }
    );
    if (!updatedPriority) {
      return res.status(404).json({ message: "Priority not found" });
    }
    res.status(200).json(updatedPriority);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a priority
const deletePriority = async (req, res) => {
  try {
    const deletedPriority = await Priority.findByIdAndDelete(req.query.id);
    if (!deletedPriority) {
      return res.status(404).json({ message: "Priority not found" });
    }
    res.status(200).json({ message: "Priority deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPriority,
  getAllPriorities,
  getPriorityById,
  updatePriority,
  deletePriority,
};
