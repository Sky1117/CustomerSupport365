const AdminReply = require("../models/adminReply.model");
const { sendAdminReplyEmail } = require("../../config/email.config");
const mongoose = require("mongoose");
const Ticket = require("../models/tickets.model");
const multer = require("multer");
const path = require("path");

// Set up storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Set up file filter to accept only certain file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|PNG|gif|pdf/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only images and PDFs are allowed."));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter,
}).array("attachments", 10);

// Validation function
const validateAdminReply = (data) => {
  const errors = [];
  if (!data.input || typeof data.input !== "string") {
    errors.push("Input is required and must be a string.");
  }
  if (data.attachments && !Array.isArray(data.attachments)) {
    errors.push("Attachments must be an array of strings.");
  }
  if (data.ticketId && !mongoose.Types.ObjectId.isValid(data.ticketId)) {
    errors.push("Ticket ID must be a valid ObjectId.");
  }
  if (data.replyTo && typeof data.replyTo !== "string") {
    errors.push("ReplyTo must be a string.");
  }
  return errors;
};

// Create AdminReply
const createAdminReply = async (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: err.message });
    }

    const { input, ticketId, replyTo } = req.body;
    const attachments = req.files ? req.files.map((file) => file.path) : [];
    const createdBy = req.userId;
    const newAdminReply = {
      input,
      attachments: attachments || [],
      ticketId,
      replyTo,
      createdBy,
    };

    // Validate input
    const validationErrors = validateAdminReply(newAdminReply);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    try {
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      const adminReply = new AdminReply(newAdminReply);
      await adminReply.save();

      // Send email if replyTo is equal to email
      if (replyTo === "email") {
        await sendAdminReplyEmail(
          ticket.email,
          ticket.maintopic,
          `You have a new reply: ${input}`
        );
      }

      res.status(201).json(adminReply);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

// Get all AdminReplies
const getAllAdminReplies = async (req, res) => {
  try {
    const adminReplies = await AdminReply.find().populate("ticketId");
    res.status(200).json(adminReplies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get AdminReply by ID
const getAdminReplyById = async (req, res) => {
  const { id } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID format." });
  }

  try {
    const adminReply = await AdminReply.findById(id).populate("ticketId");
    if (!adminReply) {
      return res.status(404).json({ error: "AdminReply not found." });
    }
    res.status(200).json(adminReply);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getAllAdminRepliesByTicketId = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: "Ticket ID is required" });
  }
  try {
    const adminReplies = await AdminReply.find({
      ticketId: id,
    })
      .populate("ticketId")
      .populate("createdBy", "name")
      .exec();
    res.status(200).json(adminReplies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getAllRepliesToCustomerByTicketId = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: "Ticket ID is required" });
  }
  try {
    const adminReplies = await AdminReply.find({
      ticketId: id,
      replyTo: "email",
    })
      .populate("createdBy", "name")
      .exec();
    res.status(200).json(adminReplies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Update AdminReply by ID
const updateAdminReply = async (req, res) => {
  const { id } = req.query;
  const { input, ticketId, replyTo } = req.body;
  const attachments = req.files ? req.files.map((file) => file.path) : [];

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID format." });
  }

  const updatedAdminReply = { input, attachments, ticketId, replyTo };

  // Validate input
  const validationErrors = validateAdminReply(updatedAdminReply);
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const adminReply = await AdminReply.findByIdAndUpdate(
      id,
      updatedAdminReply,
      { new: true }
    );
    if (!adminReply) {
      return res.status(404).json({ error: "AdminReply not found." });
    }

    // Send email if replyTo is equal to email
    if (replyTo == "email") {
      await sendAdminReplyEmail(
        ticket.email,
        "Admin Reply Updated",
        `Your reply has been updated: ${input}`
      );
    }

    res.status(200).json(adminReply);
  } catch (error) {
    res.status500.json({ error: error.message });
  }
};

// Delete AdminReply by ID
const deleteAdminReply = async (req, res) => {
  const { id } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID format." });
  }

  try {
    const adminReply = await AdminReply.findByIdAndDelete(id);
    if (!adminReply) {
      return res.status(404).json({ error: "AdminReply not found." });
    }
    res.status(200).json({ message: "AdminReply deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getFirstReplyTime = async (req, res) => {
  try {
    // Extract filter parameters from query
    const {
      period = "currentDay", // Default to 'currentDay' if no period is specified
      startDate,
      endDate,
    } = req.query;

    // Determine the date range based on the period
    let filter = {};
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    now.setHours(23, 59, 59, 999);
    const endOfToday = now;

    switch (period) {
      case "currentDay":
        filter = { createdAt: { $gte: startOfToday, $lte: endOfToday } };
        break;
      case "previousDay":
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const endOfYesterday = new Date(endOfToday);
        endOfYesterday.setDate(endOfYesterday.getDate() - 1);
        filter = {
          createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
        };
        break;
      case "currentWeek":
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        filter = { createdAt: { $gte: startOfWeek, $lte: endOfToday } };
        break;
      case "previousWeek":
        const startOfLastWeek = new Date(startOfToday);
        startOfLastWeek.setDate(
          startOfLastWeek.getDate() - startOfLastWeek.getDay() - 7
        );
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
        filter = { createdAt: { $gte: startOfLastWeek, $lte: endOfLastWeek } };
        break;
      case "currentMonth":
        const startOfMonth = new Date(
          startOfToday.getFullYear(),
          startOfToday.getMonth(),
          1
        );
        filter = { createdAt: { $gte: startOfMonth, $lte: endOfToday } };
        break;
      case "previousMonth":
        const startOfLastMonth = new Date(
          startOfToday.getFullYear(),
          startOfToday.getMonth() - 1,
          1
        );
        const endOfLastMonth = new Date(startOfLastMonth);
        endOfLastMonth.setMonth(endOfLastMonth.getMonth() + 1);
        endOfLastMonth.setDate(0);
        filter = {
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        };
        break;
      case "custom":
        if (!startDate || !endDate) {
          return res.status(400).json({
            error:
              "For custom date range, both startDate and endDate are required.",
          });
        }
        filter = {
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        };
        break;
      default:
        // If 'all' or invalid period, default to current day
        filter = { createdAt: { $gte: startOfToday, $lte: endOfToday } };
    }

    // Fetch tickets with the date filter applied
    const tickets = await Ticket.find(filter).exec();

    // Collect all admin reply IDs from tickets
    const adminReplyIds = tickets.flatMap(
      (ticket) => ticket.adminReplies || []
    );

    // Fetch all admin replies
    const adminReplies = await AdminReply.find({
      _id: { $in: adminReplyIds },
    }).exec();

    // Create a map for quick lookup
    const adminRepliesMap = new Map(
      adminReplies.map((reply) => [reply._id.toString(), reply])
    );

    const groups = {
      "0-1 hours": [],
      "1-8 hours": [],
      "8-24 hours": [],
      "more than 24 hours": [],
      "no admin replies": [],
    };

    tickets.forEach((ticket) => {
      const replies = ticket.adminReplies || [];
      if (replies.length === 0) {
        groups["no admin replies"].push(ticket);
      } else {
        const firstAdminReplyId = replies[0].toString();
        const firstAdminReply = adminRepliesMap.get(firstAdminReplyId);
        if (firstAdminReply) {
          const firstReplyTime =
            new Date(firstAdminReply.createdAt) - new Date(ticket.createdAt);
          const hours = firstReplyTime / (1000 * 60 * 60);

          if (hours <= 1) {
            groups["0-1 hours"].push(ticket);
          } else if (hours <= 8) {
            groups["1-8 hours"].push(ticket);
          } else if (hours <= 24) {
            groups["8-24 hours"].push(ticket);
          } else {
            groups["more than 24 hours"].push(ticket);
          }
        } else {
          groups["no admin replies"].push(ticket); // If the reply isn't found, handle it appropriately
        }
      }
    });

    res.status(200).json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching first reply time groups." });
  }
};

// Get ticket resolve time
const getTicketResolveTime = async (req, res) => {
  try {
    // Extract filter parameters from query
    const {
      period = "currentDay", // Default to 'currentDay' if no period is specified
      startDate,
      endDate,
    } = req.query;

    // Determine the date range based on the period
    let filter = {};
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    now.setHours(23, 59, 59, 999);
    const endOfToday = now;

    switch (period) {
      case "currentDay":
        filter = { createdAt: { $gte: startOfToday, $lte: endOfToday } };
        break;
      case "previousDay":
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const endOfYesterday = new Date(endOfToday);
        endOfYesterday.setDate(endOfYesterday.getDate() - 1);
        filter = {
          createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
        };
        break;
      case "currentWeek":
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        filter = { createdAt: { $gte: startOfWeek, $lte: endOfToday } };
        break;
      case "previousWeek":
        const startOfLastWeek = new Date(startOfToday);
        startOfLastWeek.setDate(
          startOfLastWeek.getDate() - startOfLastWeek.getDay() - 7
        );
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
        filter = { createdAt: { $gte: startOfLastWeek, $lte: endOfLastWeek } };
        break;
      case "currentMonth":
        const startOfMonth = new Date(
          startOfToday.getFullYear(),
          startOfToday.getMonth(),
          1
        );
        filter = { createdAt: { $gte: startOfMonth, $lte: endOfToday } };
        break;
      case "previousMonth":
        const startOfLastMonth = new Date(
          startOfToday.getFullYear(),
          startOfToday.getMonth() - 1,
          1
        );
        const endOfLastMonth = new Date(startOfLastMonth);
        endOfLastMonth.setMonth(endOfLastMonth.getMonth() + 1);
        endOfLastMonth.setDate(0);
        filter = {
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        };
        break;
      case "custom":
        if (!startDate || !endDate) {
          return res.status(400).json({
            error:
              "For custom date range, both startDate and endDate are required.",
          });
        }
        filter = {
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        };
        break;
      default:
        // If 'all' or invalid period, default to current day
        filter = { createdAt: { $gte: startOfToday, $lte: endOfToday } };
    }

    // Fetch tickets with the date filter applied
    const tickets = await Ticket.find(filter).exec();

    const groups = {
      "0-1 hours": [],
      "1-8 hours": [],
      "8-24 hours": [],
      "more than 24 hours": [],
      "not closed yet": [],
    };

    tickets.forEach((ticket) => {
      if (ticket.status === "closed") {
        const resolveTime = new Date() - new Date(ticket.closedAt);
        const hours = resolveTime / (1000 * 60 * 60);

        if (hours <= 1) {
          groups["0-1 hours"].push(ticket);
        } else if (hours <= 8) {
          groups["1-8 hours"].push(ticket);
        } else if (hours <= 24) {
          groups["8-24 hours"].push(ticket);
        } else {
          groups["more than 24 hours"].push(ticket);
        }
      } else {
        groups["not closed yet"].push(ticket);
      }
    });

    res.status(200).json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching tickets" });
  }
};

const getTicketsByPlatform = async (req, res) => {
  try {
    // Extract filter parameters from query
    const {
      period = "currentDay", // Default to 'currentDay' if no period is specified
      startDate,
      endDate,
    } = req.query;

    // Determine the date range based on the period
    let filter = {};
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    now.setHours(23, 59, 59, 999);
    const endOfToday = now;

    switch (period) {
      case "currentDay":
        filter = { createdAt: { $gte: startOfToday, $lte: endOfToday } };
        break;
      case "previousDay":
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const endOfYesterday = new Date(endOfToday);
        endOfYesterday.setDate(endOfYesterday.getDate() - 1);
        filter = {
          createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
        };
        break;
      case "currentWeek":
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        filter = { createdAt: { $gte: startOfWeek, $lte: endOfToday } };
        break;
      case "previousWeek":
        const startOfLastWeek = new Date(startOfToday);
        startOfLastWeek.setDate(
          startOfLastWeek.getDate() - startOfLastWeek.getDay() - 7
        );
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
        filter = { createdAt: { $gte: startOfLastWeek, $lte: endOfLastWeek } };
        break;
      case "currentMonth":
        const startOfMonth = new Date(
          startOfToday.getFullYear(),
          startOfToday.getMonth(),
          1
        );
        filter = { createdAt: { $gte: startOfMonth, $lte: endOfToday } };
        break;
      case "previousMonth":
        const startOfLastMonth = new Date(
          startOfToday.getFullYear(),
          startOfToday.getMonth() - 1,
          1
        );
        const endOfLastMonth = new Date(startOfLastMonth);
        endOfLastMonth.setMonth(endOfLastMonth.getMonth() + 1);
        endOfLastMonth.setDate(0);
        filter = {
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        };
        break;
      case "custom":
        if (!startDate || !endDate) {
          return res.status(400).json({
            error:
              "For custom date range, both startDate and endDate are required.",
          });
        }
        filter = {
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        };
        break;
      default:
        // If 'all' or invalid period, default to current day
        filter = { createdAt: { $gte: startOfToday, $lte: endOfToday } };
    }

    // Fetch distinct platforms with the date filter applied
    const platforms = await Ticket.distinct("platformType", filter);
    const ticketsByPlatform = {};

    for (const platform of platforms) {
      const count = await Ticket.countDocuments({
        platformType: platform,
        ...filter,
      });
      ticketsByPlatform[platform] = count;
    }

    res.status(200).json(ticketsByPlatform);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching tickets by platform" });
  }
};

module.exports = {
  createAdminReply: [upload, createAdminReply],
  getAllAdminReplies,
  getAdminReplyById,
  getAllAdminRepliesByTicketId,
  getAllRepliesToCustomerByTicketId,
  updateAdminReply: [upload, updateAdminReply],
  deleteAdminReply,
  getFirstReplyTime,
  getTicketResolveTime,
  getTicketsByPlatform,
};
