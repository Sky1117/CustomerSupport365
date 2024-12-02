const Product = require("../models/product.model");
const multer = require("multer");
const path = require("path");
const xlsx = require("xlsx");
const fs = require("fs");
const util = require("util");
const moment = require("moment");
const mkdirAsync = util.promisify(fs.mkdir);
const unlinkAsync = util.promisify(fs.unlink);

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../../uploads"),
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).array("images", 10);

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

async function createProduct(req, res) {
  const createdBy = req.userId;
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).send({ error: err });
    }

    const imagePaths = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

    const newProduct = new Product({
      productName: req.body.productName,
      productDescription: req.body.productDescription,
      price: req.body.price,
      images: imagePaths,
      createdBy: createdBy,
      isActive: req.body.isActive,
    });

    try {
      const savedProduct = await newProduct.save();
      res.status(201).json(savedProduct);
    } catch (error) {
      res.status(500).send({ error: "Error creating product" });
    }
  });
}

async function updateProduct(req, res) {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).send({ error: err });
    }

    const imagePaths = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : null;

    const updateData = {
      productName: req.body.productName,
      productDescription: req.body.productDescription,
      price: req.body.price,
    };

    if (imagePaths) {
      updateData.images = imagePaths;
    }

    try {
      const updatedProduct = await Product.findByIdAndUpdate(
        req.query.id,
        updateData,
        { new: true }
      );
      if (updatedProduct) {
        res.status(200).json(updatedProduct);
      } else {
        res.status(404).send({ error: "Product not found" });
      }
    } catch (error) {
      res.status(500).send({ error: "Error updating product" });
    }
  });
}

async function getAllProduct(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const products = await Product.find().skip(skip).limit(limitNumber);
    const totalProducts = await Product.countDocuments();

    res.status(200).json({
      totalProducts,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalProducts / limitNumber),
      products,
    });
  } catch (error) {
    res.status(500).send({ error: "Error fetching products" });
  }
}

async function getProductById(req, res) {
  try {
    const product = await Product.findById(req.query.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).send({ error: "product not found" });
    }
  } catch (error) {
    res.status(500).send({ error: "Error fetching product" });
  }
}

async function deleteProduct(req, res) {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.query.id);
    if (deletedProduct) {
      res.json(deletedProduct);
    } else {
      res.status(404).send({ error: "Product not found" });
    }
  } catch (error) {
    res.status(500).send({ error: "Error deleting Product" });
  }
}

const uploadProduct = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const products = xlsx.utils.sheet_to_json(sheet);

    for (const productData of products) {
      const { productName, productDescription, price, images } = productData;
      const imageArray =
        typeof images === "string" ? images.split(",") : images;

      const product = new Product({
        productName,
        productDescription,
        price,
        images: imageArray,
      });

      await product.save();
    }

    res.send("Products uploaded successfully.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error uploading products.");
  }
};

function parseDate(dateStr) {
  return moment(dateStr, "DD-MM-YYYY").toDate();
}

const downloadProduct = async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ message: "Start date and end date are required" });
  }

  try {
    const start = parseDate(startDate);
    const end = parseDate(endDate);

    const products = await Product.find({
      createdAt: {
        $gte: start,
        $lt: end,
      },
    });

    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found in the specified date range" });
    }

    const data = products.map((product) => ({
      productName: product.productName,
      productDescription: product.productDescription,
      price: product.price,
      images: product.images.join(", "),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Products");
    const filePath = "./downloads/products.xlsx";
    xlsx.writeFile(workbook, filePath);

    res.download(filePath, "products.xlsx", async (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        res.status(500).send("Error downloading file");
      } else {
        await unlinkAsync(filePath);
      }
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products", error });
  }
};

async function searchProducts(req, res) {
  const { keyword, page = 1, limit = 10 } = req.query;

  if (!keyword) {
    return res.status(400).send({ error: "Keyword is required for searching" });
  }

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const skip = (pageNumber - 1) * limitNumber;

  try {
    const searchRegex = new RegExp(keyword, "i");
    let query = {
      $or: [
        { productName: { $regex: searchRegex } },
        { productDescription: { $regex: searchRegex } },
      ],
    };

    const price = parseFloat(keyword);
    if (!isNaN(price)) {
      query.$or.push({ price });
    }

    const products = await Product.find(query).skip(skip).limit(limitNumber);

    const totalProducts = await Product.countDocuments(query);

    res.status(200).json({
      totalProducts,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalProducts / limitNumber),
      products,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).send({ error: "Error searching products" });
  }
}

module.exports = {
  createProduct,
  getAllProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  uploadProduct,
  downloadProduct,
  searchProducts,
};
