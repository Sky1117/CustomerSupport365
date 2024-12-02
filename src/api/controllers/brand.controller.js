const Brand = require("../models/brand.model"); // Adjust the path based on your project structure
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
// Create a new brand
const createbrand = async (req, res) => {
  const createdBy = req.userId;
  try {
    const brand = new Brand({
      Brand: req.body.Brand,
      description: req.body.description,
      createdBy: createdBy,
      isActive: req.body.isActive,
    });

    await brand.save();
    res.status(201).json(brand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all brands
const getAllbrands = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10 if not provided

    const pageNumber = parseInt(page, 10); // Convert page to integer
    const limitNumber = parseInt(limit, 10); // Convert limit to integer
    const skip = (pageNumber - 1) * limitNumber; // Calculate how many brands to skip

    // Fetch brands with pagination
    const brands = await Brand.find().skip(skip).limit(limitNumber);
    const totalbrands = await Brand.countDocuments(); // Total number of brands in the collection

    res.status(200).json({
      totalbrands,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalbrands / limitNumber),
      brands,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single brand by ID
const getbrandById = async (req, res) => {
  try {
    const { id } = req.query;
    const brand = await Brand.findById(id);

    if (!brand) {
      return res.status(404).json({ message: "brand not found" });
    }

    res.status(200).json(brand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a brand by ID
const updatebrandById = async (req, res) => {
  try {
    const { id } = req.query;
    const updatedbrand = await Brand.findByIdAndUpdate(
      id,
      { Brand: req.body.Brand, description: req.body.description },
      { new: true, runValidators: true }
    );

    if (!updatedbrand) {
      return res.status(404).json({ message: "brand not found" });
    }

    res.status(200).json(updatedbrand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a brand by ID
const deletebrandById = async (req, res) => {
  try {
    const { id } = req.query;
    const deletedbrand = await Brand.findByIdAndDelete(id);

    if (!deletedbrand) {
      return res.status(404).json({ message: "brand not found" });
    }

    res.status(200).json({ message: "brand deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBrandReport = async (req, res) => {
  try {
    const { startDate, endDate } = req;

    // Query the brands created between startDate and endDate
    const brands = await Brand.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    // Create a new Excel workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Brands");

    // Define columns
    worksheet.columns = [
      { header: "Name", key: "name", width: 30 },
      { header: "Description", key: "description", width: 50 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    // Add rows to the worksheet
    brands.forEach((brand) => {
      worksheet.addRow({
        name: brand.name,
        description: brand.description,
        createdAt: brand.createdAt,
      });
    });

    // Write to a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set the response headers to download the file
    res.setHeader("Content-Disposition", "attachment; filename=report.xlsx");
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

// Upload bulk Brands
const uploadBrand = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const brands = xlsx.utils.sheet_to_json(sheet);

    for (const brandData of brands) {
      const { name, description } = brandData;

      const brand = new Brand({
        name,
        description,
      });

      await brand.save();
    }

    res.send("Brands uploaded successfully.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error uploading brands.");
  }
};
const searchBrands = async (req, res) => {
  const { keyword, page = 1, limit = 10 } = req.query;

  if (!keyword) {
    return res.status(400).json({ message: "Keyword is required" });
  }

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const skip = (pageNumber - 1) * limitNumber;

  try {
    const searchRegex = new RegExp(keyword, "i"); // Case-insensitive regex search
    const query = {
      $or: [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ],
    };

    const brands = await Brand.find(query).skip(skip).limit(limitNumber);
    const totalBrands = await Brand.countDocuments(query);

    res.status(200).json({
      totalBrands,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalBrands / limitNumber),
      brands,
    });
  } catch (error) {
    console.error("Error searching brands:", error);
    res
      .status(500)
      .json({ message: "Error searching brands", error: error.message });
  }
};

module.exports = {
  createbrand,
  getAllbrands,
  getbrandById,
  updatebrandById,
  deletebrandById,
  getBrandReport,
  uploadBrand,
  searchBrands,
};
