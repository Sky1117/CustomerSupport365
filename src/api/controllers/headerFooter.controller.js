const HeaderFooter = require("../models/headerFooter.model");

// Create a new HeaderFooter
const createHeaderFooter = async (req, res) => {
  try {
    const { header, footer, isActive } = req.body;

    // Basic validation
    if (!header || !footer) {
      return res
        .status(400)
        .json({ message: "Header and footer are required." });
    }

    // Create the HeaderFooter object
    const headerFooter = new HeaderFooter({
      header,
      footer,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id,
    });

    // Save to the database
    const savedHeaderFooter = await headerFooter.save();
    res.status(201).json(savedHeaderFooter);
  } catch (error) {
    res.status(500).json({ message: "Error creating HeaderFooter", error });
  }
};

// Get all HeaderFooters
const getAllHeaderFooters = async (req, res) => {
  try {
    const headerFooters = await HeaderFooter.find().populate(
      "createdBy",
      "userName email"
    ); // Populate createdBy with user details
    res.status(200).json(headerFooters);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving HeaderFooters", error });
  }
};

// Get HeaderFooter by ID
const getHeaderFooterById = async (req, res) => {
  try {
    const { id } = req.query;
    const headerFooter = await HeaderFooter.findById(id);

    if (!headerFooter) {
      return res.status(404).json({ message: "HeaderFooter not found" });
    }

    res.status(200).json(headerFooter);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving HeaderFooter", error });
  }
};

// Update HeaderFooter by ID
const updateHeaderFooter = async (req, res) => {
  try {
    const { id } = req.query;
    const { header, footer, isActive } = req.body;

    // Basic validation
    if (!header || !footer) {
      return res
        .status(400)
        .json({ message: "Header and footer are required." });
    }

    const updatedHeaderFooter = await HeaderFooter.findByIdAndUpdate(
      id,
      { header, footer, isActive },
      { new: true, runValidators: true }
    ).populate("createdBy", "userName email");

    if (!updatedHeaderFooter) {
      return res.status(404).json({ message: "HeaderFooter not found" });
    }

    res.status(200).json(updatedHeaderFooter);
  } catch (error) {
    res.status(500).json({ message: "Error updating HeaderFooter", error });
  }
};

// Delete HeaderFooter by ID
const deleteHeaderFooter = async (req, res) => {
  try {
    const { id } = req.query;
    const deletedHeaderFooter = await HeaderFooter.findByIdAndDelete(id);

    if (!deletedHeaderFooter) {
      return res.status(404).json({ message: "HeaderFooter not found" });
    }

    res.status(200).json({ message: "HeaderFooter deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting HeaderFooter", error });
  }
};

module.exports = {
  createHeaderFooter,
  getAllHeaderFooters,
  getHeaderFooterById,
  updateHeaderFooter,
  deleteHeaderFooter,
};
