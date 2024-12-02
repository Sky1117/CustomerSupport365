const {
  createTicket,
  getAllTickets,
  getSingleTicket,
  updateTicket,
  deleteTicket,
  searchTickets,
  ticketFeedback,
  getReport,
  getInternalReport,
  filterTickets,
  getTicketsByUser,
  getPendingTicketsByUser,
  linkTickets,
  CustomerSatisfactionRate,
  ticketResolvedByDepartment,
  unlinkTicket,
  getDepartmentTicketStats,
  getTicketsByCustomer,
  getHighlightTicketsByUser,
} = require("../controllers/tickets.controller");
const authenticate = require("../middleware/authenticate");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// Function to parse dd-mm-yyyy format to Date object
const parseDate = (dateStr) => {
  const [day, month, year] = dateStr.split("/");
  return new Date(`${year}-${month}-${day}`);
};

// Middleware to parse and validate startDate and endDate
const parseDates = (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ message: "startDate and endDate are required" });
  }

  req.startDate = parseDate(startDate);
  req.endDate = parseDate(endDate);

  if (isNaN(req.startDate.getTime()) || isNaN(req.endDate.getTime())) {
    return res
      .status(400)
      .json({ message: "Invalid date format. Use dd-mm-yyyy." });
  }

  next();
};

module.exports = function (app) {
  app.post(
    "/api/end-user/submit-ticket",
    upload.array("attachments", 10),
    authenticate,
    createTicket
  );
  app.post(
    "/api/end-users/submit-ticket/draft",
    upload.array("attachments", 10),
    createTicket
  );
  app.get("/api/end-user/get-single-ticket", getSingleTicket);
  app.get("/api/end-user/get-all-ticket", getAllTickets);
  app.get("/api/end-user/get-searched-ticket", searchTickets);
  app.get("/api/end-user/filter-ticket", filterTickets);
  app.get("/api/office-users/report-dashboard", parseDates, getReport);
  app.get("/api/office-users/internal-report-dashboard", parseDates, getInternalReport);
  app.get("/api/office-users/get-userTickets", getTicketsByUser);
  app.get("/api/end-users/get-userTickets", getTicketsByCustomer);
  app.get("/api/office-users/get-pending-userTickets", getPendingTicketsByUser);
  app.get(
    "/api/office-users/ticket-resolved-by-user",
    ticketResolvedByDepartment
  );
  app.get(
    "/api/office-users/get-Customer-Satisfaction-Rate",
    CustomerSatisfactionRate
  );
  app.get("/api/department-ticket-stats", getDepartmentTicketStats);

  app.post(
    "/api/end-user/update-ticket",
    upload.array("attachments", 10),
    updateTicket
  );
  app.post("/api/end-user/group-ticket", linkTickets);
  app.post("/api/end-user/ungroup-ticket", unlinkTicket);
  app.put("/api/end-user/submit-feedback", ticketFeedback);
  app.delete("/api/end-user/delete-ticket", deleteTicket);
  app.get(
    "/api/office-users/get-highlight-userTickets",
    getHighlightTicketsByUser
  );
};
