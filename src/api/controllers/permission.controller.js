const Permission = require("../models/permission.model");

const validatePermission = (permission) => {
  const keys = [
    "dashboard",
    "createTicket",
    "submitTicket",
    "ticketManager",
    "ticketDetails",
    "departmentMaster",
    "ticketSearch",
    "ticketPending",
    "statusMaster",
    "ticketTitle",
    "ticketSubtitle",
    "internalReports",
    "websiteReports",
    "supportPending",
    "slaConfig",
    "slaDashboard",
    "kbase",
    "createFaq",
    "templateManagement",
    "usersManagement",
    "articles",
    "rolesManagement",
    "permissionsManagement",
    "login",
    "signup",
    "warrantyPage",
    "warrantyStatusCheck",
    "productsInfo",
    "selectIssuePage",
    "addressInfo",
    "documentsUpload",
    "thankyouPage",
    "trackTicket",
    "profile",
  ];

  for (const key of keys) {
    if (permission[key] !== undefined && typeof permission[key] !== "boolean") {
      return false;
    }
  }

  return true;
};

// Create a new permission
const createPermission = async (req, res) => {
  const createdBy = req.userId;
  try {
    if (!validatePermission(req.body)) {
      return res.status(400).json({ error: "Invalid permission fields" });
    }

    const permission = new Permission({ createdBy, ...req.body });
    await permission.save();
    res
      .status(201)
      .json({ message: "Permission created successfully", permission });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all permissions with pagination
const getAllPermissions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const permissions = await Permission.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await Permission.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      permissions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get a permission by ID
const getPermissionById = async (req, res) => {
  try {
    const permission = await Permission.findById(req.query.id);
    if (!permission) {
      return res.status(404).json({ message: "Permission not found" });
    }
    res.status(200).json(permission);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update a permission by ID
const updatePermission = async (req, res) => {
  try {
    if (!validatePermission(req.body)) {
      return res.status(400).json({ error: "Invalid permission fields" });
    }

    const permission = await Permission.findByIdAndUpdate(
      req.query.id,
      req.body,
      { new: true }
    );
    if (!permission) {
      return res.status(404).json({ message: "Permission not found" });
    }
    res
      .status(200)
      .json({ message: "Permission updated successfully", permission });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a permission by ID
const deletePermission = async (req, res) => {
  try {
    const permission = await Permission.findByIdAndDelete(req.query.id);
    if (!permission) {
      return res.status(404).json({ message: "Permission not found" });
    }
    res.status(200).json({ message: "Permission deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createPermission,
  getAllPermissions,
  getPermissionById,
  updatePermission,
  deletePermission,
};
