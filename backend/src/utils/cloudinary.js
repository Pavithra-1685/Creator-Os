const cloudinaryLib = require('cloudinary').v2;

cloudinaryLib.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinaryLib.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });
};

const destroy = (publicId) => cloudinaryLib.uploader.destroy(publicId);

module.exports = { uploadBuffer, destroy, cloudinaryLib };
