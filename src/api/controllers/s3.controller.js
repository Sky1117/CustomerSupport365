const AWS = require("aws-sdk");
const fs = require("fs");

const s3Bucket = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  // sessionToken: process.env.AWS_SESSION_TOKEN,
  region: "ap-south-1",
});

console.log(s3Bucket.config.credentials);

// Function to upload one file on s3 bucket
const uploadFile = async (file) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      ContentType: file.mimetype,
      Key: `${file.originalname}`,
      Body: file.buffer,
      ACL: "public-read",
    };

    return new Promise((resolve, reject) => {
      s3Bucket.upload(params, (err, data) => {
        if (err) {
          return reject({ err: err.message });
        }
        return resolve(data.Location);
      });
    });
  } catch (error) {
    console.log(error);
    throw error; // Handle this error in the calling function
  }
};

// Function to upload multiple files on s3 bucket
const uploadFiles = async (files) => {
  try {
    const uploadPromises = files.map(async (file) => {
      const fileKey = file.originalname;
      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        ContentType: file.mimetype,
        Key: fileKey,
        Body: file.buffer || (await fs.promises.readFile(file.path)),
        ACL: "public-read",
      };

      return new Promise((resolve, reject) => {
        s3Bucket.upload(params, (err, data) => {
          if (err) {
            return reject({ err: err.message });
          }
          return resolve(data.Location);
        });
      });
    });

    const fileUrls = await Promise.all(uploadPromises);
    return fileUrls;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = {
  uploadFile,
  uploadFiles,
};
