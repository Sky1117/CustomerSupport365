const userModel = require("../models/users.model");
const Role = require("../models/role.model");
const mongoose = require("mongoose");
const Ticket = require("../models/tickets.model");
const bcrypt = require("bcryptjs");
const config = require("../../config/auth.config");
const randomstring = require("randomstring");
const slugify = require("slugify");
const jwt = require("jsonwebtoken");
const { sendVerifyEmail, sendEmail } = require("../../config/email.config");

const validatePassword = (password) => {
  const errors = [];

  if (password.length <= 8) {
    errors.push("Password must be exactly 8 characters long.");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter.");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number.");
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push(
      "Password must contain at least one special character (@$!%*?&)."
    );
  }

  return errors.length > 0 ? errors : null;
};

const validateEmail = (email) => {
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_PATTERN.test(email)) {
    return "Invalid email format.";
  }
  return null;
};

const validatePhone = (phone) => {
  const PHONE_PATTERN = /^\d{10}$/;
  if (!PHONE_PATTERN.test(phone)) {
    return "Phone number must be exactly 10 digits long.";
  }
  return null;
};

const signup = async (req, res) => {
  try {
    const { name, email, phoneNumber, password, role, permission } = req.body;

    if (!(name && email && password && role)) {
      return res
        .status(400)
        .json({ message: `All fields are required`, status: 400 });
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ message: emailError, status: 400 });
    }

    const phoneError = validatePhone(phoneNumber);
    if (phoneError) {
      return res.status(400).json({ message: phoneError, status: 400 });
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors) {
      return res
        .status(400)
        .json({ message: passwordErrors.join(" "), status: 400 });
    }

    const userExist = await userModel.findOne({ email: email }).select("_id");
    if (userExist) {
      return res
        .status(400)
        .json({ message: "Email already in use", status: 400 });
    }

    // Check if role exists
    const roleExists = await Role.findById(role);
    if (!roleExists) {
      return res
        .status(400)
        .json({ message: "Invalid role provided", status: 400 });
    }

    // Check if the permissions are mapped to the provided role
    const invalidPermissions = [];
    if (permission) {
      for (const perm of permission) {
        if (!roleExists.permissions.includes(perm)) {
          invalidPermissions.push(perm);
        }
      }
    }

    if (invalidPermissions.length > 0) {
      return res.status(400).json({
        message: `Invalid permissions provided for the role: ${invalidPermissions.join(
          ", "
        )}`,
        status: 400,
      });
    }

    const newUser = new userModel({
      name,
      email,
      phoneNumber,
      password: bcrypt.hashSync(password, 8),
      role,
      permission: permission,
    });

    await newUser.save();

    sendVerifyEmail(name, email, newUser._id);

    return res.status(200).json({
      message: "User registered successfully. Please verify your email!",
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, status: 500 });
  }
};

const signin = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.body.email }).populate({
      path: "role",
      populate: {
        path: "permissions._id",
        model: "Permission",
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User Not found.", status: 404 });
    }
    var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!",
      });
    }

    var token = jwt.sign({ id: user._id }, config.secret, { expiresIn: 86400 }); // 24 hours

    await userModel.findByIdAndUpdate(user._id, { token: token });

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken: token,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, status: 500 });
  }
};
const signingrest = async (req, res) => {
  try {
    const { email, userId, shopifyId, password } = req.body;

    if (!((email || userId || shopifyId) && password)) {
      return res.status(400).json({
        message:
          "Identifier (email, userId, or shopifyId) and password are required",
        status: 400,
      });
    }

    const user = await userModel
      .findOne({
        $or: [{ email: email }, { userId: userId }, { shopifyId: shopifyId }],
      })
      .populate({
        path: "role",
        populate: {
          path: "permissions._id",
          model: "Permission",
        },
      });

    if (!user) {
      return res.status(404).json({ message: "User Not found.", status: 404 });
    }
    var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!",
      });
    }

    var token = jwt.sign({ id: user._id }, config.secret, { expiresIn: 86400 }); // 24 hours

    await userModel.findByIdAndUpdate(user._id, { token: token });

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken: token,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, status: 500 });
  }
};
const createSlug = (name) => {
  const baseSlug = slugify(name);

  // Append a random string to ensure uniqueness
  const uniqueSuffix = randomstring.generate({
    length: 6,
    charset: "alphanumeric",
  });

  return `${baseSlug}-${uniqueSuffix}`;
};

const createGrestUser = async (req, res) => {
  try {
    const { userId, userName, email, shopifyId, phoneNumber } = req.body;
    // Create the slug from userName
    const slug = createSlug(userName);

    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (phoneNumber && !phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }
    const name = userName;
    const existingUser = await userModel.findOne({
      $or: [{ userId }, { shopifyId }, { email }],
    });
    if (existingUser) {
      return res
        .status(201)
        .json({ message: "User Exists", user: existingUser });
    }
    const password = randomstring.generate();
    const newUser = new userModel({
      userId,
      name,
      slug, // Save the slug in the database
      email,
      shopifyId,
      password,
      phoneNumber,
    });

    await newUser.save();

    res
      .status(201)
      .json({ message: "User created successfully", userSlug: newUser.slug });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
};

const getGrestUserById = async (req, res) => {
  try {
    const { slug } = req.query;
    const user = await userModel.findOne({ slug });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const token = jwt.sign({ id: user._id }, config.secret, {
      expiresIn: 86400,
    }); // 24 hours
    await userModel.findByIdAndUpdate(user._id, { token: token });

    res.status(200).json({ user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
};

const update = async (req, res) => {
  try {
    // Handle file upload
    if (req.file) {
      const file = req.file;
      const filePath = `/uploads/${file.filename}`;
      req.body.profilePhoto = filePath; // update profilePhoto field with uploaded file path
    }
    delete req.body.password;
    const result = await userModel.findByIdAndUpdate(
      { _id: req.body._id || req.body.id },
      req.body
    );
    res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({ message: error.message, status: 500 });
  }
};

const deleteById = async (req, res) => {
  try {
    const result = await userModel.findByIdAndDelete({
      _id: req.query._id || req.query.id,
    });
    res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({ message: error.message, status: 500 });
  }
};

const findById = async (req, res) => {
  try {
    const result = await userModel.findById({
      _id: req.query._id || req.query.id,
    });
    res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({ message: error.message, status: 500 });
  }
};

const findAll = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit);
    const page = parseInt(req.query.page);
    const query = {};
    const result = await userModel
      .find(query)
      .limit(limit)
      .skip(limit * page);
    const totalRecords = await userModel.countDocuments(query);
    res.status(200).json({ result, totalRecords });
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message, message: "Internal server error." });
  }
};

const reset_password = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found", status: 404 });
    }

    const resetToken = randomstring.generate();
    user.resetPasswordToken = resetToken;
    await user.save();

    const resetLink = `${req.protocol}://${req.get(
      "host"
    )}/reset_password/${resetToken}`;
    await sendEmail(
      email,
      "Password Reset",
      `Click the link to reset your password: ${resetLink}`
    );

    res.status(200).json({ message: "Password reset email sent", status: 200 });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", status: 500, error: err.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found", status: 404 });
    }

    const resetToken = randomstring.generate();
    user.resetPasswordToken = resetToken;
    await user.save();

    const resetLink = `${req.protocol}://${req.get(
      "host"
    )}/reset_password/${resetToken}`;
    await sendEmail(
      email,
      "Password Reset",
      `Click the link to reset your password: ${resetLink}`
    );

    res.status(200).json({ message: "Password reset email sent", status: 200 });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", status: 500, error: err.message });
  }
};

const verifymail = async (req, res) => {
  try {
    const verifiedMail = await userModel.updateOne(
      { _id: req.query.id },
      { $set: { is_verified: 1 } }
    );
    console.log(verifiedMail);
  } catch (error) {
    console.log(error.message);
  }
};
const changePassword = async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  try {
    // Find the user by email
    const user = await userModel.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the old password is correct
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserReport = async (req, res) => {
  try {
    const { startDate, endDate } = req;

    // Query the users created between startDate and endDate
    const users = await userModel.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    // Create a new Excel workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    // Define columns
    worksheet.columns = [
      { header: "Name", key: "name", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone Number", key: "phoneNumber", width: 20 },
      { header: "Role", key: "role", width: 15 },
      { header: "Status", key: "status", width: 10 },
      { header: "Address", key: "address", width: 50 },
      { header: "Profile Photo", key: "profilePhoto", width: 50 },
      { header: "Token", key: "token", width: 50 },
      { header: "Verified", key: "is_verified", width: 10 },
      { header: "Parent ID", key: "parentId", width: 24 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    // Add rows to the worksheet
    users.forEach((user) => {
      worksheet.addRow({
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        status: user.status ? "Active" : "Inactive",
        address: user.address,
        profilePhoto: user.profilePhoto,
        token: user.token,
        is_verified: user.is_verified,
        parentId: user.parentId ? user.parentId.toString() : null,
        createdAt: user.createdAt,
      });
    });

    // Write to a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set the response headers to download the file
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=user_report.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Send the buffer as the response
    res.status(200).send(buffer);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error generating report", error: err.message });
  }
};

// Search User
async function searchUsers(criteria) {
  try {
    const query = {};
    if (criteria.name) {
      query.name = { $regex: new RegExp(criteria.name, "i") };
    }
    if (criteria.email) {
      query.email = { $regex: new RegExp(criteria.email, "i") };
    }
    if (criteria.phoneNumber) {
      query.phoneNumber = criteria.phoneNumber;
    }
    if (criteria.userId) {
      query.userId = criteria.userId;
    }
    if (criteria.shopifyId) {
      query.shopifyId = criteria.shopifyId;
    }
    const users = await userModel.find(query).exec();
    return users;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
const getUser = async (req, res) => {
  const { name, email, phoneNumber, userId, shopifyId } = req.query;

  if (!name && !email && !phoneNumber && !userId && !shopifyId) {
    return res.status(400).json({
      message:
        "At least one search criteria (name, email, phoneNumber, userId, shopifyId) must be provided.",
    });
  }

  const criteria = {
    name: name || null,
    email: email || null,
    phoneNumber: phoneNumber || null,
    userId: userId || null,
    shopifyId: shopifyId || null,
  };

  try {
    const users = await searchUsers(criteria);
    if (users.length === 0) {
      res
        .status(404)
        .json({ message: "No users found with the provided criteria." });
    } else {
      res.status(200).json(users);
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error searching users", error: error.message });
  }
};

// Upload bulk Users
const uploadUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const users = xlsx.utils.sheet_to_json(sheet);

    for (const userData of users) {
      const {
        name,
        email,
        phoneNumber,
        password,
        address,
        role,
        permission,
        status,
        profilePhoto,
        token,
        is_verified,
        parentId,
      } = userData;

      const user = new userModel({
        name,
        email,
        phoneNumber,
        password,
        address,
        role,
        permission,
        status,
        profilePhoto,
        token,
        is_verified,
        parentId: parentId ? new mongoose.Types.ObjectId(parentId) : undefined,
      });

      await user.save();
    }

    res.send("Users uploaded successfully.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error uploading users.");
  }
};

// Add tickets to ticketAssigned
const assignTicketsToUser = async (req, res) => {
  try {
    const { userId, ticketIds } = req.body;

    if (!userId || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({
        message: "userId and an array of ticketIds are required",
        status: 400,
      });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: 404,
      });
    }

    // // Add unique ticket IDs to the ticketAssigned array
    // user.ticketAssigned = [
    //   ...new Set([
    //     ...user.ticketAssigned,
    //     ...ticketIds.map((id) => mongoose.Types.ObjectId(id)),
    //   ]),
    // ];

    // await user.save();

    await Ticket.updateMany(
      { _id: { $in: ticketIds.map((id) => mongoose.Types.ObjectId(id)) } },
      { assignedTo: userId }
    );

    return res.status(200).json({
      message: "Tickets assigned successfully",
      ticketAssigned: user.ticketAssigned,
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, status: 500 });
  }
};

module.exports = {
  signup,
  signin,
  update,
  deleteById,
  findById,
  findAll,
  reset_password,
  forgotPassword,
  changePassword,
  verifymail,
  getUserReport,
  getUser,
  uploadUsers,
  assignTicketsToUser,
  createGrestUser,
  getGrestUserById,
};
