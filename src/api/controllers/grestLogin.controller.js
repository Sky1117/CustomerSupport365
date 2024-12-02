const GrestUser = require("../models/users.model");
const config = require("../../config/auth.config");
const jwt = require("jsonwebtoken");

// Create a new user
const createUser = async (req, res) => {
  try {
    const { userId, grestUserName, email, address, shopifyId, phoneNumber } =
      req.body;
    const profilePhoto = req.file ? req.file.path : ""; // Get file path

    if (!userId || !grestUserName || !email || !shopifyId) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (phoneNumber && !phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    const existingUser = await GrestUser.findOne({
      $or: [{ userId }, { shopifyId }],
    });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this userId or shopifyId already exists" });
    }

    const newUser = new GrestUser({
      userId,
      grestUserName,
      email,
      profilePhoto,
      address,
      shopifyId,
      phoneNumber,
    });

    await newUser.save();

    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await GrestUser.find();
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

// Get user by userId
const getUserById = async (req, res) => {
  try {
    const user = await GrestUser.findOne({ userId: req.query.userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const token = jwt.sign({ id: user._id }, config.secret, {
      expiresIn: 86400,
    }); // 24 hours
    await GrestUser.findByIdAndUpdate(user._id, { token: token });

    res.status(200).json({ user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { userId, phoneNumber } = req.body;
    const profilePhoto = req.file ? req.file.path : null; // Get file path

    if (phoneNumber) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ message: "Invalid phone number format" });
      }
    }

    const updateData = {};
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (profilePhoto) updateData.profilePhoto = profilePhoto;

    const updatedUser = await GrestUser.findOneAndUpdate(
      { userId: req.query.userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await GrestUser.findOneAndDelete({
      userId: req.query.userId,
    });
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
