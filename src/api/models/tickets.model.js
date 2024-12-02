const mongoose = require("mongoose");

const { Schema } = mongoose;

// Function to generate the ticket number
const generateTicketNumber = async () => {
  const today = new Date();
  const datePart = today
    .toISOString()
    .slice(0, 10)
    .split("-")
    .reverse()
    .join(""); // yyyy-mm-dd to ddmmyyyy
  const count = await Ticket.countDocuments({
    ticketNumber: { $regex: new RegExp(`^${datePart}`) },
  });
  const sequentialNumber = (count + 1).toString().padStart(4, "0");
  return `${datePart}${sequentialNumber}`;
};

const ticketSchema = new Schema(
  {
    platformType: String,
    customerType: String,
    brand: String,
    productName: String,
    maintopic: String,
    subTopic: String,
    fullName: String,
    email: String,
    mobileNo: Number,
    alternativeEmail: String,
    alternativeMobileNo: String,
    address: {
      addressLine1: String,
      addressLine2: String,
      landmark: String,
      pincode: String,
      city: String,
      state: String,
    },
    imeiNo1: String,
    imeiNo2: String,
    chooseProduct: String,
    ticketTitle: String,
    ticketDescription: String,
    category: String,
    attachments: { type: [String] },
    linkedTickets: [
      {
        groupId: String,
        title: String,
        subtitle: String,
        ticketNo: String,
        subject: String,
      },
    ],
    awbNumber: String,
    courier: String,
    highlightTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    priority: { type: mongoose.Schema.Types.ObjectId, ref: "Priority" },
    priorityChangedAt: { type: Date },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    comments: String,
    status: { type: String, default: "Open" },
    status2: { type: mongoose.Schema.Types.ObjectId, ref: "StatusMaster" },
    feedback: String,
    rating: String,
    billing: String,
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DepartmentMaster",
    },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
    parentId: mongoose.Types.ObjectId,
    escalationTimestamps: [Date],
    ticketNumber: { type: String, unique: true },
    isActive: Boolean,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

// Pre-save middleware to generate unique ticket number
ticketSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      this.ticketNumber = await generateTicketNumber();
      next();
    } catch (error) {
      next(error);
    }
  }

  if (this.isModified("priority")) {
    this.priorityChangedAt = new Date();
  }
  next();
});

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;
