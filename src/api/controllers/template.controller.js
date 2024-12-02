const Template = require("../models/template.model"); // Adjust the path as necessary
const xlsx = require("xlsx");
const ExcelJS = require("exceljs");

// Create a new template
const createTemplate = async (req, res) => {
  const createdBy = req.userId;
  const {
    templateType,
    templateName,
    templateDescription,
    templateStatusName,
    isActive,
  } = req.body;

  try {
    // Basic validation
    if (!templateType || !templateName || !templateDescription) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    // Check for uniqueness when templateType is "Email"
    if (templateType === "Email") {
      const existingTemplate = await Template.findOne({
        templateStatusName,
        templateName,
      });
      if (existingTemplate) {
        return res.status(400).json({
          error:
            "For Email templates, templateStatusName and templateName must be unique.",
        });
      }
    }

    // Create and save the new template
    const template = new Template({
      templateType,
      templateName,
      templateDescription,
      templateStatusName,
      isActive,
      createdBy,
    });
    await template.save();

    res
      .status(200)
      .json({ message: "Template created successfully.", template });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
};

// Retrieve all templates
const getTemplates = async (req, res) => {
  try {
    const templates = await Template.find().populate(
      "templateStatusName",
      "statusName"
    );
    res.status(200).json(templates);
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
};

// Retrieve a template by ID
const getTemplateById = async (req, res) => {
  const { id } = req.query;

  try {
     const template = await Template.findById(id).populate(
       "templateStatusName",
       "statusName"
     );
    if (!template) {
      return res.status(404).json({ error: "Template not found." });
    }
    res.status(200).json(template);
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
};

// Update a template
const updateTemplate = async (req, res) => {
  const {
    _id,
    templateType,
    templateName,
    templateDescription,
    templateStatusName,
    templateHeaderFooter,
    isActive,
  } = req.body;

  try {
    const template = await Template.findById(_id);
    if (!template) {
      return res.status(404).json({ error: "Template not found." });
    }

    // Check for uniqueness when templateType is "Email"
    if (templateType === "Email" && templateName && templateStatusName) {
      const existingTemplate = await Template.findOne({
        templateStatusName,
        templateName,
        _id: { $ne: _id },
      });
      if (existingTemplate) {
        return res.status(400).json({
          error:
            "For Email templates, templateStatusName and templateName must be unique.",
        });
      }
    }

    // Update only the fields that are provided in the request
    if (templateType) template.templateType = templateType;
    if (templateName) template.templateName = templateName;
    if (templateDescription) template.templateDescription = templateDescription;
    if (templateStatusName) template.templateStatusName = templateStatusName;
    if (templateHeaderFooter)
      template.templateHeaderFooter = templateHeaderFooter;
    if (isActive !== undefined) template.isActive = isActive;

    await template.save();

    res
      .status(200)
      .json({ message: "Template updated successfully.", template });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a template
const deleteTemplate = async (req, res) => {
  const { _id } = req.query;

  try {
    const template = await Template.findById(_id);
    if (!template) {
      return res.status(404).json({ error: "Template not found." });
    }

    await template.remove();
    res.status(200).json({ message: "Template deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
};

// Search templates by name
const searchTemplates = async (req, res) => {
  const { name } = req.query;

  try {
    const templates = await Template.find({
      templateName: new RegExp(name, "i"),
    });

    if (templates.length === 0) {
      return res.status(404).json({ message: "No templates found." });
    }

    res.status(200).json(templates);
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
};

// Upload templates from an Excel file
const uploadTemplate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const templates = xlsx.utils.sheet_to_json(sheet);

    for (const templateData of templates) {
      const {
        templateType,
        templateName,
        templateDescription,
        templateStatusName,
      } = templateData;

      // Check for uniqueness when templateType is "Email"
      if (templateType === "Email") {
        const existingTemplate = await Template.findOne({
          templateStatusName,
          templateName,
        });
        if (existingTemplate) {
          return res.status(400).json({
            error: `Template with name "${templateName}" and status "${templateStatusName}" already exists.`,
          });
        }
      }

      const template = new Template({
        templateType,
        templateName,
        templateDescription,
        templateStatusName,
      });

      await template.save();
    }

    res.send("Templates uploaded successfully.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error uploading templates.");
  }
};

// Download templates as an Excel file
const downloadTemplates = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const templates = await Template.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Templates");

    worksheet.columns = [
      { header: "Template Type", key: "templateType", width: 20 },
      { header: "Template Name", key: "templateName", width: 30 },
      { header: "Template Description", key: "templateDescription", width: 60 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    templates.forEach((template) => {
      worksheet.addRow({
        templateType: template.templateType,
        templateName: template.templateName,
        templateDescription: template.templateDescription,
        createdAt: template.createdAt,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=template_report.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.status(200).send(buffer);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error generating report", error: err.message });
  }
};

module.exports = {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  searchTemplates,
  uploadTemplate,
  downloadTemplates,
};
