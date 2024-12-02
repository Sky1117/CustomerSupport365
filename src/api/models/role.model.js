const mongoose = require("mongoose");

const DeviationSchema = new mongoose.Schema({
  dashboard: { type: Boolean, default: false },
  createTicket: { type: Boolean, default: false },
  submitTicket: { type: Boolean, default: false },
  ticketManager: { type: Boolean, default: false },
  ticketDetails: { type: Boolean, default: false },
  departmentMaster: { type: Boolean, default: false },
  ticketSearch: { type: Boolean, default: false },
  ticketPending: { type: Boolean, default: false },
  statusMaster: { type: Boolean, default: false },
  ticketTitle: { type: Boolean, default: false },
  ticketSubtitle: { type: Boolean, default: false },
  internalReports: { type: Boolean, default: false },
  websiteReports: { type: Boolean, default: false },
  supportPending: { type: Boolean, default: false },
  slaConfig: { type: Boolean, default: false },
  slaDashboard: { type: Boolean, default: false },
  kbase: { type: Boolean, default: false },
  createFaq: { type: Boolean, default: false },
  templateManagement: { type: Boolean, default: false },
  usersManagement: { type: Boolean, default: false },
  articles: { type: Boolean, default: false },
  rolesManagement: { type: Boolean, default: false },
  permissionsManagement: { type: Boolean, default: false },
  login: { type: Boolean, default: false },
  signup: { type: Boolean, default: false },
  warrantyPage: { type: Boolean, default: false },
  warrantyStatusCheck: { type: Boolean, default: false },
  productsInfo: { type: Boolean, default: false },
  selectIssuePage: { type: Boolean, default: false },
  addressInfo: { type: Boolean, default: false },
  documentsUpload: { type: Boolean, default: false },
  thankyouPage: { type: Boolean, default: false },
  trackTicket: { type: Boolean, default: false },
  profile: { type: Boolean, default: false },
});

const RoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    permissions: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Permission",
          required: true,
        },
        deviation: DeviationSchema,
      },
    ],
    isActive: Boolean,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    parentId: mongoose.Types.ObjectId,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Role", RoleSchema);
