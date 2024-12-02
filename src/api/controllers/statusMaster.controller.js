const StatusMaster = require("../models/statusMaster.model");

// Create Status
const createStatus = async (req, res) => {
  const { statusName, websiteView, isActive } = req.body;
  const createdBy = req.userId;

  if (!statusName) {
    return res.status(400).json({ error: "Status name is required" });
  }

  try {
    const status = new StatusMaster({
      statusName,
      websiteView,
      isActive,
      createdBy,
    });

    await status.save();
    res.status(201).json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Statuses
const getAllStatuses = async (req, res) => {
  try {
    const statuses = await StatusMaster.find().populate("createdBy", "name");
    res.status(200).json(statuses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Status by ID
const getStatusById = async (req, res) => {
  const { id } = req.query;

  try {
    const status = await StatusMaster.findById(id).populate(
      "createdBy",
      "name"
    );
    if (!status) {
      return res.status(404).json({ error: "Status not found" });
    }
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Status
const updateStatus = async (req, res) => {
  const { id } = req.query;
  const { statusName, websiteView, isActive } = req.body;

  try {
    const status = await StatusMaster.findById(id);
    if (!status) {
      return res.status(404).json({ error: "Status not found" });
    }

    status.statusName = statusName || status.statusName;
    status.websiteView =
      websiteView !== undefined ? websiteView : status.websiteView;
    status.isActive = isActive !== undefined ? isActive : status.isActive;

    await status.save();
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Status
const deleteStatus = async (req, res) => {
  const { id } = req.query;

  try {
    const status = await StatusMaster.findById(id);
    if (!status) {
      return res.status(404).json({ error: "Status not found" });
    }

    await status.remove();
    res.status(200).json({ message: "Status deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search Statuses with Pagination
const searchStatuses = async (req, res) => {
  const { statusName } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const query = statusName ? { statusName: new RegExp(statusName, "i") } : {};
    const total = await StatusMaster.countDocuments(query);
    const statuses = await StatusMaster.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      statuses,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createStatus,
  getAllStatuses,
  getStatusById,
  updateStatus,
  deleteStatus,
  searchStatuses,
};
