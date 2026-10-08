const cloudinary = require("../config/cloudinary");

const uploadImage = (buffer, folder = "shopsphere/products") => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image"
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve({
                    publicId: result.public_id,
                    url: result.secure_url
                });
            }
        );

        uploadStream.end(buffer);
    });
};

const deleteImage = async (publicId) => {
    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId);
};

module.exports = {
    uploadImage,
    deleteImage
};