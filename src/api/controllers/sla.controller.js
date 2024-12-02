const SLA = require("../models/sla.modal");
const DepartmentMaster = require("../models/department.model");

// Create a new SLA
const createSLA = async (req, res) => {
  const createdBy = req.userId;
  try {
    const sla = new SLA({
      department: req.body.department,
      level_1_FRT: req.body.level_1_FRT,
      level_2_FRT: req.body.level_2_FRT,
      level_3_FRT: req.body.level_3_FRT,
      level_4_FRT: req.body.level_4_FRT,
      ticketActionTimeout: req.body.ticketActionTimeout,
      createdBy: createdBy,
      isActive: req.body.isActive,
    });
    await sla.save();
    res.status(201).json(sla);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all SLAs
const getAllSLAs = async (req, res) => {
  try {
    const slas = await SLA.find().populate("department");
    res.status(200).json(slas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get SLA by ID
const getSLAById = async (req, res) => {
  try {
    const sla = await SLA.findById(req.query.id).populate("department");
    if (!sla) {
      return res.status(404).json({ message: "SLA not found" });
    }
    res.status(200).json(sla);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getSLAByDepartmentId = async (req, res) => {
  try {
    const sla = await SLA.findOne({
      department: req.query._id,
    }).populate("department");
    if (!sla) {
      return res
        .status(404)
        .json({ message: "SLA not found for this department" });
    }
    res.status(200).json(sla);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Update SLA by ID
const updateSLA = async (req, res) => {
  try {
    const sla = await SLA.findByIdAndUpdate(req.query.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("department");
    if (!sla) {
      return res.status(404).json({ message: "SLA not found" });
    }
    res.status(200).json(sla);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete SLA by ID
const deleteSLA = async (req, res) => {
  try {
    const sla = await SLA.findByIdAndDelete(req.query.id);
    if (!sla) {
      return res.status(404).json({ message: "SLA not found" });
    }
    res.status(200).json({ message: "SLA deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTicketActionTimeoutByUserId = async (req, res) => {
  try {
    const userId = req.userId;

    const department = await DepartmentMaster.findOne({
      $or: [
        { level1: userId },
        { level2: userId },
        { level3: userId },
        { level4: userId },
      ],
    });

    if (!department) {
      return res
        .status(404)
        .json({ message: "User not assigned to any department" });
    }

    const sla = await SLA.findOne({ department: department._id });

    if (!sla) {
      return res
        .status(404)
        .json({ message: "SLA not found for this department" });
    }

    // Return the ticketActionTimeout
    res.status(200).json({ ticketActionTimeout: sla.ticketActionTimeout });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createSLA,
  getAllSLAs,
  getSLAById,
  getSLAByDepartmentId,
  updateSLA,
  deleteSLA,
  getTicketActionTimeoutByUserId,
};
