const Subtitle = require("../models/subtitle.model");
const mongoose = require("mongoose");

// Create a new Subtitle
const createSubtitle = async (req, res) => {
  const { name, index, isActive, websiteView } = req.body;
  const createdBy = req.userId;

  // Basic validation
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ message: "Invalid name provided" });
  }

  if (!createdBy || !mongoose.Types.ObjectId.isValid(createdBy)) {
    return res.status(400).json({ message: "Invalid createdBy user ID" });
  }

  try {
    const newSubtitle = new Subtitle({
      name,
      index,
      isActive,
      websiteView,
      createdBy,
    });

    const savedSubtitle = await newSubtitle.save();

    res.status(201).json(savedSubtitle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all Subtitles
const getAllSubtitles = async (req, res) => {
  try {
    const subtitles = await Subtitle.find().populate("createdBy", "name");

    res.status(200).json(subtitles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a Subtitle by ID
const getSubtitleById = async (req, res) => {
  const { id } = req.query;

  try {
    const subtitle = await Subtitle.findById(id).populate("createdBy", "name");

    if (!subtitle) {
      return res.status(404).json({ message: "Subtitle not found" });
    }

    res.status(200).json(subtitle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a Subtitle by ID
const updateSubtitle = async (req, res) => {
  const { id } = req.query;
  const { name, index, isActive, websiteView } = req.body;

  // Basic validation
  if (name && (typeof name !== "string" || name.trim().length === 0)) {
    return res.status(400).json({ message: "Invalid name provided" });
  }

  try {
    const updatedSubtitle = await Subtitle.findByIdAndUpdate(
      id,
      { name, index, isActive, websiteView },
      { new: true }
    ).populate("createdBy", "name");

    if (!updatedSubtitle) {
      return res.status(404).json({ message: "Subtitle not found" });
    }

    res.status(200).json(updatedSubtitle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a Subtitle by ID
const deleteSubtitle = async (req, res) => {
  const { id } = req.query;

  try {
    const deletedSubtitle = await Subtitle.findByIdAndDelete(id);

    if (!deletedSubtitle) {
      return res.status(404).json({ message: "Subtitle not found" });
    }

    res.status(200).json({ message: "Subtitle deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search Subtitles by name
const searchSubtitlesByName = async (req, res) => {
  const { name } = req.query;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ message: "Invalid name provided" });
  }

  try {
    const subtitles = await Subtitle.find({
      name: new RegExp(name, "i"),
    }).populate("createdBy", "name");

    res.status(200).json(subtitles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSubtitle,
  getAllSubtitles,
  getSubtitleById,
  updateSubtitle,
  deleteSubtitle,
  searchSubtitlesByName,
};
