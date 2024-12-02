const masterModel = require("../models/master.model");

const addMasterData = async (req, res) => {
  try {
    const data = await masterModel.insertMany(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMasterDataByName = async (req, res) => {
  try {
    const data = await masterModel
      .find({ key: req.query.key, active: true })
      .select("key value");
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addMasterData, getMasterDataByName };
