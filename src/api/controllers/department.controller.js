const DepartmentMaster = require("../models/department.model");
const User = require("../models/users.model");

// Utility function to get user details
const getUserDetails = async (userIds) => {
  const users = await User.find({ _id: { $in: userIds } });
  return users.map((user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
  }));
};

// Create a new department
const createDepartment = async (req, res) => {
  try {
    const { departmentName, role, level1, level2, level3, level4, isActive } =
      req.body;
    if (!departmentName) {
      return res.status(400).json({ message: "Department name is required" });
    }

    const level1Details = await getUserDetails(level1);
    const level2Details = await getUserDetails(level2);
    const level3Details = await getUserDetails(level3);
    const level4Details = await getUserDetails(level4);

    const newDepartment = new DepartmentMaster({
      departmentName,
      role,
      level1: level1Details.map((user) => user._id),
      level2: level2Details.map((user) => user._id),
      level3: level3Details.map((user) => user._id),
      level4: level4Details.map((user) => user._id),
      isActive,
      createdBy: req.userId,
    });

    await newDepartment.save();
    res.status(201).json(newDepartment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all departments with pagination
const getDepartments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const departments = await DepartmentMaster.find()
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("role createdBy level1 level2 level3 level4");

    const totalDepartments = await DepartmentMaster.countDocuments();

    res.json({
      total: totalDepartments,
      page: Number(page),
      limit: Number(limit),
      departments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search departments by name with pagination
const searchDepartments = async (req, res) => {
  try {
    const { page = 1, limit = 10, departmentName } = req.query;

    if (!departmentName) {
      return res
        .status(400)
        .json({ message: "Department name is required for search" });
    }

    const departments = await DepartmentMaster.find({
      departmentName: { $regex: departmentName, $options: "i" },
    })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("role createdBy level1 level2 level3 level4");

    const totalDepartments = await DepartmentMaster.countDocuments({
      departmentName: { $regex: departmentName, $options: "i" },
    });

    res.json({
      total: totalDepartments,
      page: Number(page),
      limit: Number(limit),
      departments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get department by ID
const getDepartmentById = async (req, res) => {
  try {
    const department = await DepartmentMaster.findById(req.query.id).populate(
      "role createdBy level1 level2 level3 level4"
    );

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update department by ID
const updateDepartment = async (req, res) => {
  try {
    const { departmentName, role, level1, level2, level3, level4, isActive } =
      req.body;

    const department = await DepartmentMaster.findById(req.query.id);

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    const level1Details = await getUserDetails(level1);
    const level2Details = await getUserDetails(level2);
    const level3Details = await getUserDetails(level3);
    const level4Details = await getUserDetails(level4);

    department.departmentName = departmentName || department.departmentName;
    department.role = role || department.role;
    department.level1 =
      level1Details.map((user) => user._id) || department.level1;
    department.level2 =
      level2Details.map((user) => user._id) || department.level2;
    department.level3 =
      level3Details.map((user) => user._id) || department.level3;
    department.level4 =
      level4Details.map((user) => user._id) || department.level4;
    department.isActive =
      isActive !== undefined ? isActive : department.isActive;

    await department.save();
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete department by ID
const deleteDepartment = async (req, res) => {
  try {
    const department = await DepartmentMaster.findById(req.query.id);

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    await department.remove();
    res.json({ message: "Department removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  searchDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
