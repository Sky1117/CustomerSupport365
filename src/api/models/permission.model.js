const mongoose = require("mongoose");

const PermissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    permissionDisplayName: {
      dashboard: {
        type: Boolean,
        required: true,
        default: false,
      },
      createTicket: { type: Boolean, required: true, default: false },
      submitTicket: { type: Boolean, required: true, default: false },
      ticketManager: { type: Boolean, required: true, default: false },
      ticketDetails: { type: Boolean, required: true, default: false },
      departmentMaster: { type: Boolean, required: true, default: false },
      ticketSearch: { type: Boolean, required: true, default: false },
      ticketPending: { type: Boolean, required: true, default: false },
      statusMaster: { type: Boolean, required: true, default: false },
      ticketTitle: { type: Boolean, required: true, default: false },
      ticketSubtitle: { type: Boolean, required: true, default: false },
      internalReports: { type: Boolean, required: true, default: false },
      websiteReports: { type: Boolean, required: true, default: false },
      supportPending: { type: Boolean, required: true, default: false },
      slaConfig: { type: Boolean, required: true, default: false },
      slaDashboard: { type: Boolean, required: true, default: false },
      kbase: { type: Boolean, required: true, default: false },
      createFaq: { type: Boolean, required: true, default: false },
      templateManagement: { type: Boolean, required: true, default: false },
      usersManagement: { type: Boolean, required: true, default: false },
      articles: { type: Boolean, required: true, default: false },
      rolesManagement: { type: Boolean, required: true, default: false },
      permissionsManagement: { type: Boolean, required: true, default: false },
      login: { type: Boolean, required: true, default: false },
      signup: { type: Boolean, required: true, default: false },
      warrantyPage: { type: Boolean, required: true, default: false },
      warrantyStatusCheck: { type: Boolean, required: true, default: false },
      productsInfo: { type: Boolean, required: true, default: false },
      selectIssuePage: { type: Boolean, required: true, default: false },
      addressInfo: { type: Boolean, required: true, default: false },
      documentsUpload: { type: Boolean, required: true, default: false },
      thankyouPage: { type: Boolean, required: true, default: false },
      trackTicket: { type: Boolean, required: true, default: false },
      profile: { type: Boolean, required: true, default: false },
    },
    isActive: Boolean,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Permission", PermissionSchema);
