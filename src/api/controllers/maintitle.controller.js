const MainTitle = require("../models/maintitle.model");
const mongoose = require("mongoose");

// Create a new MainTitle
const createMainTitle = async (req, res) => {
  const { name, subTitle, index, isActive, websiteView } = req.body;
  const createdBy = req.userId;

  // Basic validation
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ message: "Invalid name provided" });
  }
  if (!createdBy || !mongoose.Types.ObjectId.isValid(createdBy)) {
    return res.status(400).json({ message: "Invalid createdBy user ID" });
  }
  try {
    const newMainTitle = new MainTitle({
      name,
      subTitle,
      index,
      isActive,
      websiteView,
      createdBy,
    });
    const savedMainTitle = await newMainTitle.save();
    res.status(201).json(savedMainTitle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all MainTitles
const getAllMainTitles = async (req, res) => {
  try {
    const mainTitle = await MainTitle.find()
      .populate("subTitle.id")
      .populate("createdBy", "name");
    res.status(200).json(mainTitle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a MainTitle by ID
const getMainTitleById = async (req, res) => {
  const { id } = req.query;

  try {
    const mainTitle = await MainTitle.findById(id)
      .populate("subTitle.id")
      .populate("createdBy", "name");

    if (!mainTitle) {
      return res.status(404).json({ message: "MainTitle not found" });
    }

    res.status(200).json(mainTitle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a MainTitle by ID
const updateMainTitle = async (req, res) => {
  const { id } = req.query;
  const { name, subTitle, index, websiteView, isActive } = req.body;

  // Basic validation
  if (name && (typeof name !== "string" || name.trim().length === 0)) {
    return res.status(400).json({ message: "Invalid name provided" });
  }

  try {
    const updatedMainTitle = await MainTitle.findByIdAndUpdate(
      id,
      {
        name,
        subTitle,
        index,
        websiteView,
        isActive,
      },
      { new: true }
    )
      .populate("subTitle.id")
      .populate("createdBy", "name");

    if (!updatedMainTitle) {
      return res.status(404).json({ message: "MainTitle not found" });
    }

    res.status(200).json(updatedMainTitle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a MainTitle by ID
const deleteMainTitle = async (req, res) => {
  const { id } = req.query;

  try {
    const deletedMainTitle = await MainTitle.findByIdAndDelete(id);

    if (!deletedMainTitle) {
      return res.status(404).json({ message: "MainTitle not found" });
    }

    res.status(200).json({ message: "MainTitle deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search MainTitles by name
const searchMainTitles = async (req, res) => {
  const { name } = req.query;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ message: "Invalid name provided" });
  }

  try {
    const mainTitle = await MainTitle.find({
      name: { $regex: name, $options: "i" },
    })
      .populate("subTitle.id")
      .populate("createdBy", "name");

    if (!mainTitle.length) {
      return res.status(404).json({ message: "No MainTitles found" });
    }

    res.status(200).json(mainTitle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createMainTitle,
  getAllMainTitles,
  getMainTitleById,
  updateMainTitle,
  deleteMainTitle,
  searchMainTitles,
};
