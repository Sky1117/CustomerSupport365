const Role = require("../models/role.model");
const Permission = require("../models/permission.model");

// Create a new role
const createRole = async (req, res) => {
  try {
    const { name, permissions, parentId, isActive } = req.body;
    const createdBy = req.userId;
    // Basic validation
    if (!name) {
      return res.status(400).json({ message: "Role name is required" });
    }

    // Create and save the role
    const role = new Role({ name, permissions, parentId, isActive, createdBy });
    await role.save();
    res.status(201).json({ message: "Role created successfully", role });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all roles with pagination
const getAllRoles = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Basic validation
    if (page < 1 || limit < 1) {
      return res
        .status(400)
        .json({ message: "Page and limit must be positive integers" });
    }

    const roles = await Role.find()
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("permissions");

    const totalRoles = await Role.countDocuments();

    if (roles.length === 0) {
      return res.status(404).json({ message: "No roles found" });
    }

    res.status(200).json({
      roles,
      totalRoles,
      totalPages: Math.ceil(totalRoles / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get a role by ID
const getRoleById = async (req, res) => {
  try {
    const { id } = req.query;

    // Basic validation
    if (!id) {
      return res.status(400).json({ message: "Role ID is required" });
    }

    const role = await Role.findById(id).populate("permissions");
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }
    res.status(200).json(role);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update a role by ID
const updateRole = async (req, res) => {
  try {
    const { id } = req.query;
    const updateData = req.body;

    // Basic validation
    if (!id) {
      return res.status(400).json({ message: "Role ID is required" });
    }
    if (!updateData.name) {
      return res
        .status(400)
        .json({ message: "Role name is required for update" });
    }

    const role = await Role.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("permissions");
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }
    res.status(200).json({ message: "Role updated successfully", role });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a role by ID
const deleteRole = async (req, res) => {
  try {
    const { id } = req.query;

    // Basic validation
    if (!id) {
      return res.status(400).json({ message: "Role ID is required" });
    }

    const role = await Role.findByIdAndDelete(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }
    res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Add a permission to a role
const addPermissionToRole = async (req, res) => {
  try {
    const { roleId, permissionId } = req.body;

    // Basic validation
    if (!roleId || !permissionId) {
      return res
        .status(400)
        .json({ message: "Role ID and Permission ID are required" });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({ message: "Permission not found" });
    }

    if (!role.permissions.includes(permissionId)) {
      role.permissions.push(permissionId);
      await role.save();
      res.status(200).json({ message: "Permission added to role", role });
    } else {
      res
        .status(400)
        .json({ message: "Permission already exists for this role" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Remove a permission from a role
const removePermissionFromRole = async (req, res) => {
  try {
    const { roleId, permissionId } = req.body;

    // Basic validation
    if (!roleId || !permissionId) {
      return res
        .status(400)
        .json({ message: "Role ID and Permission ID are required" });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    const permissionIndex = role.permissions.indexOf(permissionId);
    if (permissionIndex > -1) {
      role.permissions.splice(permissionIndex, 1);
      await role.save();
      res.status(200).json({ message: "Permission removed from role", role });
    } else {
      res.status(400).json({ message: "Permission not found for this role" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  addPermissionToRole,
  removePermissionFromRole,
};
