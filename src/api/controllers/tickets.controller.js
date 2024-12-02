const Ticket = require("../models/tickets.model");
const XLSX = require("xlsx");
const ExcelJS = require("exceljs");
const User = require("../models/users.model");
const cron = require("node-cron");
const { sendStatusChangeEmail } = require("../../config/email.config");
const SLA = require("../models/sla.modal");
const DepartmentMaster = require("../models/department.model");
const StatusMaster = require("../models/statusMaster.model");
const { uploadFiles } = require("./s3.controller.js");
const Priority = require("../models/priority.model");
const Template = require("../models/template.model.js");
const HeaderFooter = require("../models/headerFooter.model.js");
const {
  sendTemplateEmail,
  sendPriorityExpireEmail,
} = require("../../config/email.config.js");
function replaceTemplateVariables(templateDescription, ticket) {
  const user = User.findById(ticket.customerId);
  const variableMap = {
    "{{Customer Name}}": user.name,
    "{{Product Name}}": ticket.productName,
    "{{Ticket ID}}": ticket._id.toString(),
    "{{Ticket Created At}}": ticket.createdAt,
    "{{Issue Type}}": ticket.issueType,
    "{{Courier Name}}": ticket.courier,
    "{{AWB No.}}": ticket.awbNumber,
    "{{Return AWB No.}}": ticket.ReturnAwbNumber,
    "{{TAT}}": ticket.Tat,
    "{{Ticket Status}}": ticket.status,
    "{{Ticket Status}}": ticket.status2.statusName,
    "{{Title}}": ticket.maintopic,
    "{{Sub Title}}": ticket.subTopic,
    "{{Customer Email ID}}": ticket.email,
    "{{ Customer Mobile No.}}": ticket.mobileNo,
  };
  // console.log(User.findById(ticket.customerId));

  let replacedDescription = templateDescription;

  for (const [variable, value] of Object.entries(variableMap)) {
    replacedDescription = replacedDescription.replace(
      new RegExp(variable, "g"),
      value
    );
  }

  return replacedDescription;
}
// Create a new ticket
const createTicket = async (req, res) => {
  const createdBy = req.userId;
  try {
    const user = await User.findById(req.body.customerId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Create the new ticket
    const currStatus = await StatusMaster.find({
      statusName: "Ticket Created",
    });
    let uploadedAttachments = [];

    if (req.files && req.files.length > 0) {
      // Call the uploadFiles function to upload and get the URLs
      uploadedAttachments = await uploadFiles(req.files);
    }
    const newTicket = new Ticket({
      customerType: req.body.customerType,
      platformType: req.body.platformType,
      brand: req.body.brand,
      productName: req.body.productName,
      maintopic: req.body.maintopic,
      subTopic: req.body.subTopic,
      fullName: req.body.fullName || user.name,
      email: req.body.email || user.email,
      mobileNo: req.body.mobileNo || user.phoneNumber,
      alternativeEmail: req.body.alternativeEmail,
      alternativeMobileNo: req.body.alternativeMobileNo,
      address: {
        addressLine1: req.body.address.addressLine1,
        addressLine2: req.body.address.addressLine2,
        landmark: req.body.address.landmark,
        pincode: req.body.address.pincode,
        city: req.body.address.city,
        state: req.body.address.state,
      },
      imeiNo1: req.body.imeiNo1,
      imeiNo2: req.body.imeiNo2,
      chooseProduct: req.body.chooseProduct,
      ticketTitle: req.body.ticketTitle,
      ticketDescription: req.body.ticketDescription,
      category: req.body.category,
      attachments: uploadedAttachments,
      priority: req.body.priority,
      customerId: user._id,
      assignedTo: req.body.assignedTo,
      comments: req.body.comments,
      status:
        req.body.status && req.body.status !== "" ? req.body.status : "New",
      status2: currStatus[0]._id,
      feedback: req.body.feedback,
      rating: req.body.rating,
      billing: req.body.billing,
      department: req.body.department,
      resolvedBy: req.body.resolvedBy,
      resolvedAt: req.body.resolvedAt,
      isActive: req.body.isActive,
      createdBy: createdBy,
    });
    // Save the new ticket
    await newTicket.save();
    res.json({
      message: "Ticket created successfully",
      newTicket,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, status: 500 });
  }
};

// Get all tickets
const getAllTickets = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10 if not provided

    const pageNumber = parseInt(page, 10); // Convert page to integer
    const limitNumber = parseInt(limit, 10); // Convert limit to integer
    const skip = (pageNumber - 1) * limitNumber; // Calculate how many tickets to skip

    // Fetch tickets with pagination
    const tickets = await Ticket.find()
      .populate("assignedTo", "name email")
      .populate("status2")
      .populate("customerId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .exec();
    const totalTickets = await Ticket.countDocuments(); // Total number of tickets in the collection

    res.status(200).json({
      totalTickets,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalTickets / limitNumber),
      tickets,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching tickets" });
  }
};

// Get a single ticket by ID
const getSingleTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.query.id)
      .populate("customerId", "name")
      .populate("status2");
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching ticket" });
  }
};

// Update a ticket
const updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.body._id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    ticket.platformType =
      req.body.platformType !== undefined
        ? req.body.platformType
        : ticket.platformType;
    ticket.customerType =
      req.body.customerType !== undefined
        ? req.body.customerType
        : ticket.customerType;
    ticket.brand = req.body.brand !== undefined ? req.body.brand : ticket.brand;
    ticket.productName =
      req.body.productName !== undefined
        ? req.body.productName
        : ticket.productName;
    ticket.maintopic =
      req.body.maintopic !== undefined ? req.body.maintopic : ticket.maintopic;
    ticket.subTopic =
      req.body.subTopic !== undefined ? req.body.subTopic : ticket.subTopic;
    ticket.alternativeEmail =
      req.body.alternativeEmail !== undefined
        ? req.body.alternativeEmail
        : ticket.alternativeEmail;
    ticket.alternativeMobileNo =
      req.body.alternativeMobileNo !== undefined
        ? req.body.alternativeMobileNo
        : ticket.alternativeMobileNo;
    ticket.address = {
      addressLine1:
        req.body.addressLine1 !== undefined
          ? req.body.addressLine1
          : ticket.address.addressLine1,
      addressLine2:
        req.body.addressLine2 !== undefined
          ? req.body.addressLine2
          : ticket.address.addressLine2,
      landmark:
        req.body.landmark !== undefined
          ? req.body.landmark
          : ticket.address.landmark,
      pincode:
        req.body.pincode !== undefined
          ? req.body.pincode
          : ticket.address.pincode,
      city: req.body.city !== undefined ? req.body.city : ticket.address.city,
      state:
        req.body.state !== undefined ? req.body.state : ticket.address.state,
    };
    ticket.imeiNo1 =
      req.body.imeiNo1 !== undefined ? req.body.imeiNo1 : ticket.imeiNo1;
    ticket.imeiNo2 =
      req.body.imeiNo2 !== undefined ? req.body.imeiNo2 : ticket.imeiNo2;
    ticket.chooseProduct =
      req.body.chooseProduct !== undefined
        ? req.body.chooseProduct
        : ticket.chooseProduct;
    ticket.ticketTitle =
      req.body.ticketTitle !== undefined
        ? req.body.ticketTitle
        : ticket.ticketTitle;
    ticket.ticketDescription =
      req.body.ticketDescription !== undefined
        ? req.body.ticketDescription
        : ticket.ticketDescription;
    ticket.category =
      req.body.category !== undefined ? req.body.category : ticket.category;
    ticket.status =
      req.body.status !== undefined ? req.body.status : ticket.status;
    ticket.status2 =
      req.body.status2 !== undefined ? req.body.status2 : ticket.status2;
    ticket.comments =
      req.body.comments !== undefined ? req.body.comments : ticket.comments;
    ticket.priority =
      req.body.priority !== undefined ? req.body.priority : ticket.priority;
    ticket.customerId =
      req.body.customerId !== undefined
        ? req.body.customerId
        : ticket.customerId;
    ticket.assignedTo =
      req.body.assignedTo !== undefined
        ? req.body.assignedTo
        : ticket.assignedTo;
    ticket.feedback =
      req.body.feedback !== undefined ? req.body.feedback : ticket.feedback;
    ticket.rating =
      req.body.rating !== undefined ? req.body.rating : ticket.rating;
    ticket.billing =
      req.body.billing !== undefined ? req.body.billing : ticket.billing;
    ticket.department =
      req.body.department !== undefined
        ? req.body.department
        : ticket.department;
    ticket.resolvedBy =
      req.body.resolvedBy !== undefined
        ? req.body.resolvedBy
        : ticket.resolvedBy;
    ticket.resolvedAt =
      req.body.resolvedAt !== undefined
        ? req.body.resolvedAt
        : ticket.resolvedAt;
    ticket.parentId =
      req.body.parentId !== undefined ? req.body.parentId : ticket.parentId;
    if (
      req.body.status2 === "Pick-Up Request Generated" ||
      req.body.status2 === "Return Process"
    ) {
      ticket.awbNumber = req.body.awbNumber;
      ticket.courier = req.body.courier;
    } else {
      ticket.awbNumber = ticket.awbNumber;
      ticket.courier = ticket.courier;
    }

    ticket.escalationLevel =
      req.body.escalationLevel !== undefined
        ? req.body.escalationLevel
        : ticket.escalationLevel;
    ticket.escalationTimestamps =
      req.body.escalationTimestamps !== undefined
        ? req.body.escalationTimestamps
        : ticket.escalationTimestamps;

    if (req.files) {
      ticket.attachments = req.files.map((file) => file.path);
    }

    if (req.body.status2 !== undefined) {
      const currStatus = await StatusMaster.findById(req.body.status2);
      if (currStatus.statusName === "Delivered") {
        ticket.status = "Closed";
      }
    }

    if (req.body.assignedTo !== undefined) {
      ticket.assignedTo = req.body.assignedTo;
      ticket.status = "Pending";
    }
    if ((ticket.isActive = true)) {
      if (
        req.body.status2 !== undefined &&
        req.body.status2 !== ticket.status2
      ) {
        ticket.status2 = req.body.status2;

        // Find the template matching the new status2
        const matchingTemplate = await Template.findOne({
          templateStatusName: req.body.status2,
          isActive: true,
        }).populate("templateStatusName");

        if (matchingTemplate) {
          // Do something with the matching template
          console.log(
            `Matching template found: ${matchingTemplate.templateName}`
          );

          // Here you can add any additional logic you want to perform with the template
          // For example, you might want to use the template description:
          ticket.statusDescription = matchingTemplate.templateDescription;

          // Or you might want to trigger some other action based on the template type:
          if (matchingTemplate.templateType === "Email") {
            // Fetch header and footer
            const headerFooter = await HeaderFooter.findOne({ isActive: true });

            if (!headerFooter) {
              console.log("No active header and footer found");
              // You might want to use default header and footer or handle this case differently
            }

            // Replace variables in the template description
            let replacedDescription = replaceTemplateVariables(
              matchingTemplate.templateDescription,
              ticket
            );

            // Construct the full email content
            const fullEmailContent = `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; }
              </style>
            </head>
            <body>
              ${headerFooter ? headerFooter.header : ""}
              ${replacedDescription}
              ${headerFooter ? headerFooter.footer : ""}
            </body>
          </html>
        `;

            console.log("Full email content:", fullEmailContent);

            // Get the customer's email from the ticket
            const customerEmail = ticket.email || ticket.alternativeEmail;

            if (customerEmail) {
              try {
                // Send the email
                await sendTemplateEmail({
                  to: customerEmail,
                  subject: `Status Update for Ticket ${ticket._id}`,
                  html: fullEmailContent,
                });
                console.log(`Email sent to ${customerEmail}`);
              } catch (emailError) {
                console.error("Error sending email:", emailError);
              }
            } else {
              console.log("No customer email found for this ticket");
              ticket.emailSendError = true;
            }

            // Save the email content to the ticket if needed
            ticket.emailContent = fullEmailContent;
          } else if (matchingTemplate.templateType === "sms") {
            // Send an SMS using the template
            // await sendSMS(ticket, matchingTemplate);
          }
        } else {
          console.log("No matching template found for the new status");
        }
      } else {
        ticket.status2 = ticket.status2;
      }
    }
    // Save the ticket
    await ticket.save();

    // Update all linked tickets
    await Ticket.updateMany(
      { _id: { $in: ticket.linkedTickets.map((t) => t.groupId) } },
      {
        $set: {
          customerType: ticket.customerType,
          platformType: ticket.platformType,
          brand: ticket.brand,
          productName: ticket.productName,
          maintopic: ticket.maintopic,
          subTopic: ticket.subTopic,
          alternativeEmail: ticket.alternativeEmail,
          alternativeMobileNo: ticket.alternativeMobileNo,
          imeiNo1: ticket.imeiNo1,
          imeiNo2: ticket.imeiNo2,
          chooseProduct: ticket.chooseProduct,
          ticketTitle: ticket.ticketTitle,
          ticketDescription: ticket.ticketDescription,
          category: ticket.category,
          status: ticket.status,
          status2: ticket.status2,
          comments: ticket.comments,
          priority: ticket.priority,
          customerId: ticket.customerId,
          assignedTo: ticket.assignedTo,
          feedback: ticket.feedback,
          awbNumber: ticket.awbNumber,
          courier: ticket.courier,
          rating: ticket.rating,
          billing: ticket.billing,
          department: ticket.department,
          resolvedBy: ticket.resolvedBy,
          resolvedAt: ticket.resolvedAt,
          attachments: ticket.attachments,
        },
      }
    );

    res.json({ message: "Ticket updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating ticket" });
  }
};

const ticketFeedback = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.query.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    ticket.feedback = req.body.feedback;
    ticket.rating = req.body.rating;
    await ticket.save();
    res.json({ message: "Feedback sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error feedback failed" });
  }
};

// Delete a ticket
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.query.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    res.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting ticket" });
  }
};

// Search tickets
const searchTickets = async (req, res) => {
  try {
    const {
      ticketNumber,
      mobileNo,
      email,
      fullName,
      status,
      imeiNo,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build search query
    const searchConditions = [];

    if (ticketNumber) {
      searchConditions.push({
        ticketNumber: { $regex: ticketNumber, $options: "i" },
      });
    }

    if (mobileNo) {
      searchConditions.push({ mobileNo: mobileNo });
    }

    if (email) {
      searchConditions.push({ email: { $regex: email, $options: "i" } });
    }

    if (status) {
      searchConditions.push({ status: { $regex: status, $options: "i" } });
    }

    if (fullName) {
      searchConditions.push({ fullName: { $regex: fullName, $options: "i" } });
    }

    if (imeiNo) {
      searchConditions.push({ imeiNo1: imeiNo }, { imeiNo2: imeiNo });
    }

    // Combine all conditions with $or
    const searchQuery =
      searchConditions.length > 0 ? { $or: searchConditions } : {};

    // Perform search with pagination
    const tickets = await Ticket.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .exec();
    const totalTickets = await Ticket.countDocuments(searchQuery); // Total number of matching tickets

    res.status(200).json({
      totalTickets,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalTickets / limitNumber),
      tickets,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error searching tickets" });
  }
};

// filter tickets
const filterTickets = async (req, res) => {
  try {
    const {
      customerId,
      assignedTo,
      platformType,
      ticketTitle,
      status,
      dateFrom,
      dateTo,
      subtitle,
      page = 1,
      limit = 10,
    } = req.query;
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const [day, month, year] = dateStr.split("-").map(Number);
      return new Date(year, month - 1, day);
    };

    // Build the query object
    const query = {};

    if (customerId) {
      query.customerId = customerId;
    }
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }
    if (platformType) {
      query.platformType = platformType;
    }
    if (subtitle) {
      query.subtitle = subtitle;
    }

    if (ticketTitle) {
      query.ticketTitle = { $regex: new RegExp(ticketTitle, "i") }; // Case-insensitive search
    }

    if (status) {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};

      if (dateFrom) {
        const fromDate = parseDate(dateFrom);
        if (fromDate) {
          query.createdAt.$gte = fromDate;
        } else {
          console.error("Invalid dateFrom format");
        }
      }

      if (dateTo) {
        const toDate = parseDate(dateTo);
        if (toDate) {
          query.createdAt.$lte = toDate;
        } else {
          console.error("Invalid dateTo format");
        }
      }
    }

    const pageNumber = parseInt(page, 10); // Convert page to integer
    const limitNumber = parseInt(limit, 10); // Convert limit to integer
    const skip = (pageNumber - 1) * limitNumber; // Calculate how many tickets to skip

    // Perform the query with pagination
    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .exec();
    const totalTickets = await Ticket.countDocuments(query); // Total number of matching tickets

    res.status(200).json({
      totalTickets,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalTickets / limitNumber),
      tickets,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error filtering tickets" });
  }
};

const filterInternalTickets = async (req, res) => {
  try {
    const {
      customerId,
      assignedTo,
      ticketTitle,
      status,
      dateFrom,
      dateTo,
      subtitle,
      page = 1,
      limit = 10,
    } = req.query;
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const [day, month, year] = dateStr.split("-").map(Number);
      return new Date(year, month - 1, day);
    };

    // Build the query object
    const query = {};
    query.platformType = { $ne: "Website" };
    if (customerId) {
      query.customerId = customerId;
    }
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }
    if (subtitle) {
      query.subtitle = subtitle;
    }

    if (ticketTitle) {
      query.ticketTitle = { $regex: new RegExp(ticketTitle, "i") }; // Case-insensitive search
    }

    if (status) {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {}; // Assuming you want to filter based on creation date

      if (dateFrom) {
        const fromDate = parseDate(dateFrom);
        if (fromDate) {
          query.createdAt.$gte = fromDate;
        } else {
          console.error("Invalid dateFrom format");
        }
      }

      if (dateTo) {
        const toDate = parseDate(dateTo);
        if (toDate) {
          query.createdAt.$lte = toDate;
        } else {
          console.error("Invalid dateTo format");
        }
      }
    }

    const pageNumber = parseInt(page, 10); // Convert page to integer
    const limitNumber = parseInt(limit, 10); // Convert limit to integer
    const skip = (pageNumber - 1) * limitNumber; // Calculate how many tickets to skip

    // Perform the query with pagination
    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .exec();
    const totalTickets = await Ticket.countDocuments(query); // Total number of matching tickets

    res.status(200).json({
      totalTickets,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalTickets / limitNumber),
      tickets,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error filtering tickets" });
  }
};

// Export tickets to Excel
const getReport = async (req, res) => {
  try {
    const {
      customerId,
      assignedTo,
      platformType,
      ticketTitle,
      status,
      dateFrom,
      dateTo,
      subtitle,
    } = req.query;
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const [day, month, year] = dateStr.split("-").map(Number);
      return new Date(year, month - 1, day);
    };
    const query = {};

    if (customerId) {
      query.customerId = customerId;
    }
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }
    if (platformType) {
      query.platformType = platformType;
    }
    if (subtitle) {
      query.subtitle = subtitle;
    }

    if (ticketTitle) {
      query.ticketTitle = { $regex: new RegExp(ticketTitle, "i") }; // Case-insensitive search
    }

    if (status) {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {}; // Assuming you want to filter based on creation date

      if (dateFrom) {
        const fromDate = parseDate(dateFrom);
        if (fromDate) {
          query.createdAt.$gte = fromDate;
        } else {
          console.error("Invalid dateFrom format");
        }
      }

      if (dateTo) {
        const toDate = parseDate(dateTo);
        if (toDate) {
          query.createdAt.$lte = toDate;
        } else {
          console.error("Invalid dateTo format");
        }
      }
    }

    // Query the tickets created between startDate and endDate
    const tickets = await Ticket.find(query)
      .populate("customerId", "name email")
      .populate("assignedTo", "name email");

    // Create a new Excel workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tickets");

    // Define columns
    worksheet.columns = [
      { header: "Ticket Number", key: "ticketNumber", width: 20 },
      { header: "Customer Type", key: "customerType", width: 20 },
      { header: "Platform Type", key: "platformType", width: 20 },
      { header: "Brand", key: "brand", width: 20 },
      { header: "Product Name", key: "productName", width: 20 },
      { header: "Main Topic", key: "maintopic", width: 20 },
      { header: "Sub Topic", key: "subTopic", width: 20 },
      { header: "Full Name", key: "fullName", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "Mobile No", key: "mobileNo", width: 20 },
      { header: "Alternative Email", key: "alternativeEmail", width: 30 },
      {
        header: "Alternative Mobile No",
        key: "alternativeMobileNo",
        width: 20,
      },
      { header: "IMEI No 1", key: "imeiNo1", width: 20 },
      { header: "IMEI No 2", key: "imeiNo2", width: 20 },
      { header: "Choose Product", key: "chooseProduct", width: 20 },
      { header: "Ticket Title", key: "ticketTitle", width: 40 },
      { header: "Ticket Description", key: "ticketDescription", width: 50 },
      { header: "Category", key: "category", width: 20 },
      { header: "Priority", key: "priority", width: 15 },
      { header: "Status", key: "status", width: 10 },
      { header: "Status-2", key: "status2", width: 10 },
      { header: "Comments", key: "comments", width: 50 },
      { header: "Feedback", key: "feedback", width: 30 },
      { header: "Rating", key: "rating", width: 10 },
      { header: "Billing", key: "billing", width: 20 },
      { header: "Department", key: "department", width: 20 },
      { header: "ResolvedBy", key: "resolvedBy", width: 10 },
      { header: "ResolvedAt", key: "resolvedAt", width: 10 },
      { header: "Linked Ticket", key: "linkedTicket", width: 15 },
      { header: "Parent ID", key: "parentId", width: 24 },
      { header: "Escalation Level", key: "escalationLevel", width: 10 },
      {
        header: "Escalation Timestamps",
        key: "escalationTimestamps",
        width: 40,
      },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    // Add rows to the worksheet
    tickets.forEach((ticket) => {
      worksheet.addRow({
        ticketNumber: ticket.ticketNumber,
        customerType: ticket.customerType,
        platformType: ticket.platformType,
        brand: ticket.brand,
        productName: ticket.productName,
        maintopic: ticket.maintopic,
        subTopic: ticket.subTopic,
        fullName: ticket.fullName,
        email: ticket.email,
        mobileNo: ticket.mobileNo,
        alternativeEmail: ticket.alternativeEmail,
        alternativeMobileNo: ticket.alternativeMobileNo,
        imeiNo1: ticket.imeiNo1,
        imeiNo2: ticket.imeiNo2,
        chooseProduct: ticket.chooseProduct,
        ticketTitle: ticket.ticketTitle,
        ticketDescription: ticket.ticketDescription,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        status2: ticket.status2,
        comments: ticket.comments,
        feedback: ticket.feedback,
        rating: ticket.rating,
        billing: ticket.billing,
        department: ticket.department,
        resolvedBy: ticket.resolvedBy,
        resolvedAt: ticket.resolvedAt,
        linkedTicket: ticket.linkedTicket,
        parentId: ticket.parentId,
        escalationLevel: ticket.escalationLevel,
        escalationTimestamps: ticket.escalationTimestamps.join(", "), // Assuming timestamps are an array
        createdAt: ticket.createdAt,
      });
    });

    // Write to file and send
    const filePath = "./reports/tickets_report.xlsx";
    await workbook.xlsx.writeFile(filePath);
    res.download(filePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getInternalReport = async (req, res) => {
  try {
    const {
      customerId,
      assignedTo,
      ticketTitle,
      status,
      dateFrom,
      dateTo,
      subtitle,
    } = req.query;
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const [day, month, year] = dateStr.split("-").map(Number);
      return new Date(year, month - 1, day);
    };
    const query = {};
    query.platformType = { $ne: "Website" };
    if (customerId) {
      query.customerId = customerId;
    }
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }
    if (subtitle) {
      query.subtitle = subtitle;
    }

    if (ticketTitle) {
      query.ticketTitle = { $regex: new RegExp(ticketTitle, "i") }; // Case-insensitive search
    }

    if (status) {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {}; // Assuming you want to filter based on creation date

      if (dateFrom) {
        const fromDate = parseDate(dateFrom);
        if (fromDate) {
          query.createdAt.$gte = fromDate;
        } else {
          console.error("Invalid dateFrom format");
        }
      }

      if (dateTo) {
        const toDate = parseDate(dateTo);
        if (toDate) {
          query.createdAt.$lte = toDate;
        } else {
          console.error("Invalid dateTo format");
        }
      }
    }

    // Query the tickets created between startDate and endDate
    const tickets = await Ticket.find(query)
      .populate("customerId", "name email")
      .populate("assignedTo", "name email");

    // Create a new Excel workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tickets");

    // Define columns
    worksheet.columns = [
      { header: "Ticket Number", key: "ticketNumber", width: 20 },
      { header: "Customer Type", key: "customerType", width: 20 },
      { header: "Platform Type", key: "platformType", width: 20 },
      { header: "Brand", key: "brand", width: 20 },
      { header: "Product Name", key: "productName", width: 20 },
      { header: "Main Topic", key: "maintopic", width: 20 },
      { header: "Sub Topic", key: "subTopic", width: 20 },
      { header: "Full Name", key: "fullName", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "Mobile No", key: "mobileNo", width: 20 },
      { header: "Alternative Email", key: "alternativeEmail", width: 30 },
      {
        header: "Alternative Mobile No",
        key: "alternativeMobileNo",
        width: 20,
      },
      { header: "IMEI No 1", key: "imeiNo1", width: 20 },
      { header: "IMEI No 2", key: "imeiNo2", width: 20 },
      { header: "Choose Product", key: "chooseProduct", width: 20 },
      { header: "Ticket Title", key: "ticketTitle", width: 40 },
      { header: "Ticket Description", key: "ticketDescription", width: 50 },
      { header: "Category", key: "category", width: 20 },
      { header: "Priority", key: "priority", width: 15 },
      { header: "Status", key: "status", width: 10 },
      { header: "Status-2", key: "status2", width: 10 },
      { header: "Comments", key: "comments", width: 50 },
      { header: "Feedback", key: "feedback", width: 30 },
      { header: "Rating", key: "rating", width: 10 },
      { header: "Billing", key: "billing", width: 20 },
      { header: "Department", key: "department", width: 20 },
      { header: "ResolvedBy", key: "resolvedBy", width: 10 },
      { header: "ResolvedAt", key: "resolvedAt", width: 10 },
      { header: "Linked Ticket", key: "linkedTicket", width: 15 },
      { header: "Parent ID", key: "parentId", width: 24 },
      { header: "Escalation Level", key: "escalationLevel", width: 10 },
      {
        header: "Escalation Timestamps",
        key: "escalationTimestamps",
        width: 40,
      },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    // Add rows to the worksheet
    tickets.forEach((ticket) => {
      worksheet.addRow({
        ticketNumber: ticket.ticketNumber,
        customerType: ticket.customerType,
        platformType: ticket.platformType,
        brand: ticket.brand,
        productName: ticket.productName,
        maintopic: ticket.maintopic,
        subTopic: ticket.subTopic,
        fullName: ticket.fullName,
        email: ticket.email,
        mobileNo: ticket.mobileNo,
        alternativeEmail: ticket.alternativeEmail,
        alternativeMobileNo: ticket.alternativeMobileNo,
        imeiNo1: ticket.imeiNo1,
        imeiNo2: ticket.imeiNo2,
        chooseProduct: ticket.chooseProduct,
        ticketTitle: ticket.ticketTitle,
        ticketDescription: ticket.ticketDescription,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        status2: ticket.status2,
        comments: ticket.comments,
        feedback: ticket.feedback,
        rating: ticket.rating,
        billing: ticket.billing,
        department: ticket.department,
        resolvedBy: ticket.resolvedBy,
        resolvedAt: ticket.resolvedAt,
        linkedTicket: ticket.linkedTicket,
        parentId: ticket.parentId,
        escalationLevel: ticket.escalationLevel,
        escalationTimestamps: ticket.escalationTimestamps.join(", "), // Assuming timestamps are an array
        createdAt: ticket.createdAt,
      });
    });

    // Write to file and send
    const filePath = "./reports/tickets_report.xlsx";
    await workbook.xlsx.writeFile(filePath);
    res.download(filePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Import tickets from Excel
const importTicketsFromExcel = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const tickets = jsonData.map((row) => ({
      platformType: row.platformType,
      customerType: row.customerType,
      brand: row.brand,
      productName: row.productName,
      maintopic: row.maintopic,
      subTopic: row.subTopic,
      fullName: row.fullName,
      email: row.email,
      mobileNo: row.mobileNo,
      alternativeEmail: row.alternativeEmail,
      alternativeMobileNo: row.alternativeMobileNo,
      imeiNo1: row.imeiNo1,
      imeiNo2: row.imeiNo2,
      chooseProduct: row.chooseProduct,
      ticketTitle: row.ticketTitle,
      ticketDescription: row.ticketDescription,
      category: row.category,
      attachments: row.attachments ? row.attachments.split(", ") : [],
      priority: row.priority,
      customerId: row.customerId,
      assignedTo: row.assignedTo,
      comments: row.comments,
      status: row.status,
      status2: row.status2,
      feedback: row.feedback,
      rating: row.rating,
      billing: row.billing,
      linkedTicket: row.linkedTicket,
    }));

    await Ticket.insertMany(tickets);

    res.json({ message: "Tickets imported successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error importing tickets from Excel" });
  }
};

// Schedule a cron job to check for tickets that need attention
cron.schedule("0 0 * * *", async () => {
  try {
    // Find tickets that need attention
    const tickets = await Ticket.find({
      status: "Pending", // Change this as per your logic
      createdAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Older than 24 hours
    });

    // Send reminders or notifications as needed
    tickets.forEach(async (ticket) => {
      await sendStatusChangeEmail(ticket);
    });
  } catch (error) {
    console.error("Error in cron job:", error);
  }
});

const getTicketsByUser = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.query.id;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if the user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const tickets = await Ticket.find({ customerId: userId })
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .exec();
    const totalTickets = await Ticket.countDocuments({ customerId: userId });

    if (tickets.length === 0) {
      console.log(`No tickets found for user ID: ${userId}`);
    }

    res.status(200).json({
      totalTickets,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalTickets / limitNumber),
      tickets,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error fetching tickets assigned to the user" });
  }
};
const getTicketsByCustomer = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.query.id;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if the user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const tickets = await Ticket.find({ customerId: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .exec();
    const totalTickets = await Ticket.countDocuments({ customerId: userId });

    if (tickets.length === 0) {
      console.log(`No tickets found for user ID: ${userId}`);
    }

    res.status(200).json({
      totalTickets,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalTickets / limitNumber),
      tickets,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error fetching tickets assigned to the user" });
  }
};

const getPendingTicketsByUser = async (req, res) => {
  try {
    const { userId, page = 1, limit = 10 } = req.query;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if the user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    // Log the input for debugging purposes
    console.log(`Fetching tickets for user ID: ${userId}`);

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build the query object
    const query = {
      assignedTo: userId,
      status: { $ne: "Closed" },
    };

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .exec();
    const totalTickets = await Ticket.countDocuments(query);

    if (tickets.length === 0) {
      console.log(
        `No tickets found for user ID: ${userId} with status not equal to "Closed"`
      );
    }

    res.status(200).json({
      totalTickets,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalTickets / limitNumber),
      tickets,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error fetching tickets assigned to the user" });
  }
};
const getHighlightTicketsByUser = async (req, res) => {
  try {
    const { userId, page = 1, limit = 10 } = req.query;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if the user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    // Log the input for debugging purposes
    console.log(`Fetching tickets for user ID: ${userId}`);

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Build the query object
    const query = {
      highlightTo: userId,
      status: { $ne: "Closed" },
    };

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .exec();
    const totalTickets = await Ticket.countDocuments(query);

    if (tickets.length === 0) {
      console.log(
        `No tickets found for user ID: ${userId} with status not equal to "Closed"`
      );
    }

    res.status(200).json({
      totalTickets,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalTickets / limitNumber),
      tickets,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error fetching tickets assigned to the user" });
  }
};
const escalateTicket = async (ticket) => {
  try {
    const sla = await SLA.findOne({ department: ticket.department });

    if (!sla) {
      console.error(`SLA not found for department ${ticket.department}`);
      return;
    }

    const currentTime = new Date();
    const ticketAge = (currentTime - ticket.createdAt) / (1000 * 60 * 60);

    let newEscalationLevel;

    if (
      ticketAge >=
      sla.level_4_FRT + sla.level_3_FRT + sla.level_2_FRT + sla.level_1_FRT
    ) {
      newEscalationLevel = 4;
    } else if (
      ticketAge >=
      sla.level_3_FRT + sla.level_2_FRT + sla.level_1_FRT
    ) {
      newEscalationLevel = 3;
    } else if (ticketAge >= sla.level_2_FRT + sla.level_1_FRT) {
      newEscalationLevel = 2;
    } else if (ticketAge >= sla.level_1_FRT) {
      newEscalationLevel = 1;
    }

    if (newEscalationLevel > ticket.escalationLevel) {
      // Get the department
      const department = await DepartmentMaster.findById(ticket.department);
      if (department) {
        let usersToHighlight = [];

        switch (newEscalationLevel) {
          case 1:
            usersToHighlight = department.level2;
            break;
          case 2:
            usersToHighlight = department.level3;
            break;
          case 3:
          case 4:
            usersToHighlight = department.level4;
            break;
        }
        ticket.highlightTo = [
          ...new Set([...ticket.highlightTo, ...usersToHighlight]),
        ];
      }

      ticket.escalationTimestamps.push(currentTime);
      ticket.escalationLevel = newEscalationLevel;
      await ticket.save();
      console.log(
        `Ticket ${ticket._id} escalated to level ${newEscalationLevel}`
      );
    }
  } catch (error) {
    console.error(`Error escalating ticket ${ticket._id}: ${error.message}`);
  }
};

// Schedule a job to run every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log("Checking for tickets to escalate...");

  try {
    const openTickets = await Ticket.find({ status: { $ne: "Closed" } });

    for (const ticket of openTickets) {
      await escalateTicket(ticket);
    }

    console.log("Escalation check completed.");
  } catch (error) {
    console.error(`Error during escalation check: ${error.message}`);
  }
});

const linkTickets = async (req, res) => {
  try {
    const ticketIds = req.body.ticketIds;
    if (!ticketIds || ticketIds.length < 2) {
      return res
        .status(400)
        .json({ error: "At least two ticket IDs are required" });
    }

    const tickets = await Ticket.find({ _id: { $in: ticketIds } });
    if (tickets.length !== ticketIds.length) {
      return res.status(404).json({ error: "One or more tickets not found" });
    }

    // Check if all tickets have the same subTopic and maintopic
    const { subTopic, maintopic } = tickets[0];
    const allMatch = tickets.every(
      (ticket) => ticket.subTopic === subTopic && ticket.maintopic === maintopic
    );

    if (!allMatch) {
      return res.status(400).json({
        error: "Tickets Title & Sub-Title must be same",
      });
    }

    const linkedTickets = tickets.map((ticket) => ({
      groupId: ticket._id.toString(),
      title: ticket.ticketTitle,
      subtitle: ticket.ticketDescription,
      ticketNo: ticket.ticketNumber,
      subject: ticket.subject,
    }));

    await Promise.all(
      tickets.map(async (ticket) => {
        ticket.linkedTickets = linkedTickets.filter(
          (t) => t.groupId !== ticket._id.toString()
        );
        await ticket.save();
      })
    );

    res.json({ message: "Tickets linked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error linking tickets" });
  }
};

const unlinkTicket = async (req, res) => {
  try {
    const ticketId = req.body.ticketId;
    if (!ticketId) {
      return res.status(400).json({ error: "Ticket ID is required" });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const linkedTickets = await Ticket.find({
      "linkedTickets.groupId": ticket._id.toString(),
    });

    await Promise.all(
      linkedTickets.map(async (linkedTicket) => {
        linkedTicket.linkedTickets = linkedTicket.linkedTickets.filter(
          (t) => t.groupId !== ticket._id.toString()
        );
        await linkedTicket.save();
      })
    );

    ticket.linkedTickets = ticket.linkedTickets.filter(
      (t) => t.groupId !== ticket._id.toString()
    );
    await ticket.save();

    res.json({ message: "Ticket unlinked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error unlinking ticket" });
  }
};

const CustomerSatisfactionRate = async (req, res) => {
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
    const tickets = await Ticket.find({ ...filter, rating: { $ne: null } });

    const starCategories = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    tickets.forEach((ticket) => {
      if (ticket.rating >= 1 && ticket.rating <= 5) {
        starCategories[ticket.rating]++;
      }
    });

    res.json({
      totalCustomers: tickets.length,
      fiveStar: starCategories[5],
      fourStar: starCategories[4],
      threeStar: starCategories[3],
      twoStar: starCategories[2],
      oneStar: starCategories[1],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching feedback analysis" });
  }
};

const ticketResolvedByDepartment = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Daily Closed Tickets by User
    const dailyClosedTickets = await Ticket.aggregate([
      {
        $match: {
          status: "Closed",
          resolvedAt: {
            $gte: startOfToday,
            $lt: endOfToday,
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "resolvedBy",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $group: {
          _id: "$user.name",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          user: "$_id",
          count: 1,
        },
      },
    ]);

    // Daily Pending Tickets
    const dailyPendingTickets = await Ticket.countDocuments({
      status: { $ne: "Closed" },
      createdAt: {
        $gte: startOfToday,
        $lt: endOfToday,
      },
    });

    // Tickets Closed in the Last Month
    const monthlyClosedTickets = await Ticket.aggregate([
      {
        $match: {
          status: "Closed",
          resolvedAt: {
            $gte: startOfMonth,
            $lt: endOfMonth,
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "resolvedBy",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "departmentmasters",
          let: { userId: "$user._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $in: ["$$userId", "$level1"] },
                    { $in: ["$$userId", "$level2"] },
                    { $in: ["$$userId", "$level3"] },
                    { $in: ["$$userId", "$level4"] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 0,
                departmentName: 1,
              },
            },
          ],
          as: "department",
        },
      },
      { $unwind: "$department" },
      {
        $group: {
          _id: "$department.departmentName",
          count: { $sum: 1 },
          users: { $addToSet: "$user.name" },
        },
      },
      {
        $project: {
          _id: 0,
          department: "$_id",
          count: 1,
          users: 1,
        },
      },
    ]);

    // Get the name of the person who resolved the ticket
    const resolvedBy = await Ticket.aggregate([
      { $match: { status: "Closed" } },
      {
        $lookup: {
          from: "users",
          localField: "resolvedBy",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $project: { _id: 0, resolvedBy: "$user.name" } },
    ]);

    res.json({
      dailyClosedTickets,
      dailyPendingTickets,
      monthlyClosedTickets,
      resolvedBy,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching ticket statistics" });
  }
};
const getDepartmentTicketStats = async (req, res) => {
  try {
    const { userId, period = "currentDay", startDate, endDate } = req.query;

    // Find the user and their department
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const department = await DepartmentMaster.findOne({
      $or: [
        { level1: user._id },
        { level2: user._id },
        { level3: user._id },
        { level4: user._id },
      ],
    });

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    // Collect all users in the department across all levels
    const usersInDepartment = [
      ...department.level1,
      ...department.level2,
      ...department.level3,
      ...department.level4,
    ];

    // Determine date range based on the period
    let dateFilter = {};
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    now.setHours(23, 59, 59, 999);
    const endOfToday = now;

    switch (period) {
      case "currentDay":
        dateFilter = { updatedAt: { $gte: startOfToday, $lte: endOfToday } };
        break;
      case "previousDay":
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const endOfYesterday = new Date(endOfToday);
        endOfYesterday.setDate(endOfYesterday.getDate() - 1);
        dateFilter = {
          updatedAt: { $gte: startOfYesterday, $lte: endOfYesterday },
        };
        break;
      case "currentMonth":
        const startOfMonth = new Date(
          startOfToday.getFullYear(),
          startOfToday.getMonth(),
          1
        );
        dateFilter = { updatedAt: { $gte: startOfMonth, $lte: endOfToday } };
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
        dateFilter = {
          updatedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        };
        break;
      case "custom":
        if (!startDate || !endDate) {
          return res.status(400).json({
            message:
              "For custom date range, both startDate and endDate are required.",
          });
        }
        dateFilter = {
          updatedAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        };
        break;
      default:
        dateFilter = { updatedAt: { $gte: startOfToday, $lte: endOfToday } };
    }

    const stats = await Promise.all(
      usersInDepartment.map(async (userId) => {
        // Fetch the user's details
        const user = await User.findById(userId).select("name");

        const closedTicketsCount = await Ticket.countDocuments({
          assignedTo: userId,
          status: "Closed",
          ...dateFilter,
        });
        const pendingTicketsCount = await Ticket.countDocuments({
          assignedTo: userId,
          status: "Open",
          ...dateFilter,
        });

        // Monthly Closed tickets requires a separate date range filter
        const monthlyClosedTickets = await Ticket.countDocuments({
          assignedTo: userId,
          status: "Closed",
          updatedAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            $lte: endOfToday,
          },
        });

        return {
          userId,
          userName: user.name, // Include the user's name
          closedTicketsCount,
          pendingTicketsCount,
          monthlyClosedTickets,
        };
      })
    );

    res.status(200).json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const handleExpiredPriorityTimers = async (ticket, newPriorityTimer = null) => {
  const now = new Date();

  try {
    // Determine the priority timer to use
    let priorityTimer = newPriorityTimer;
    if (!priorityTimer) {
      const priority = await Priority.findById(ticket.priority);
      if (priority) {
        priorityTimer = priority.priorityTimer;
      } else {
        console.error("Priority not found for ticket:", ticket.priority);
        return;
      }
    }

    if (priorityTimer) {
      // Calculate the expiration time
      const startTime = ticket.priorityChangedAt || ticket.createdAt;
      const expirationTime = new Date(
        startTime.getTime() + priorityTimer * 60 * 1000
      );

      // If the ticket has expired
      if (now >= expirationTime) {
        const assignedUser = ticket.assignedTo;
        if (!assignedUser) {
          throw new Error("Assigned user not found");
        }

        // Fetch the user's department and determine the level
        const department =
          (await DepartmentMaster.findOne({ level1: assignedUser._id })) ||
          (await DepartmentMaster.findOne({ level2: assignedUser._id })) ||
          (await DepartmentMaster.findOne({ level3: assignedUser._id })) ||
          (await DepartmentMaster.findOne({ level4: assignedUser._id }));

        if (!department) {
          throw new Error("User department not found");
        }

        let nextLevelUsers = [];

        // Determine the user's level and set the next level users
        if (department.level1.includes(assignedUser._id)) {
          nextLevelUsers = department.level2;
        } else if (department.level2.includes(assignedUser._id)) {
          nextLevelUsers = department.level3;
        } else if (department.level3.includes(assignedUser._id)) {
          nextLevelUsers = department.level4;
        }

        // Get details of next level users
        if (nextLevelUsers.length > 0) {
          const nextLevelUserDetails = await User.find({
            _id: { $in: nextLevelUsers },
          });

          // Send emails to next level users
          const emailPromises = nextLevelUserDetails.map((user) =>
            sendPriorityExpireEmail(
              user.email,
              `Ticket ${ticket._id} Status Update`,
              `The ticket ${ticket._id} has been marked as Expired.`
            )
          );

          await Promise.all(emailPromises);
          console.log("Emails sent to next level users.");
        } else {
          console.log("No next level users to notify.");
        }
      } else {
        // If the ticket has not yet expired, set a timeout to expire it when the expiration time is reached
        const timeRemaining = expirationTime.getTime() - now.getTime();
        setTimeout(async () => {
          await handleExpiredPriorityTimers(ticket, priorityTimer);
        }, timeRemaining);
      }
    } else {
      console.error("Priority timer not found for ticket:", ticket.priority);
    }
  } catch (error) {
    console.error("Error handling expired priority timers:", error);
  }
};

// Schedule the cron job to run every minute
cron.schedule("* * * * *", async () => {
  try {
    const tickets = await Ticket.find({
      priority: { $exists: true },
      resolvedAt: { $exists: false },
      isActive: true,
    });
    for (const ticket of tickets) {
      await handleExpiredPriorityTimers(ticket);
    }
  } catch (error) {
    console.error("Error running cron job for expired priority timers:", error);
  }
});

module.exports = {
  createTicket,
  getAllTickets,
  getSingleTicket,
  updateTicket,
  ticketFeedback,
  deleteTicket,
  searchTickets,
  getReport,
  getInternalReport,
  importTicketsFromExcel,
  filterTickets,
  filterInternalTickets,
  getTicketsByUser,
  getPendingTicketsByUser,
  getHighlightTicketsByUser,
  linkTickets,
  CustomerSatisfactionRate,
  ticketResolvedByDepartment,
  unlinkTicket,
  getDepartmentTicketStats,
  getTicketsByCustomer,
};
