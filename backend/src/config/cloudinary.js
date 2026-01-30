const { v2: cloudinary } = require('cloudinary');
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = require('./env');

// Configure Cloudinary
cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} buffer - Image file buffer from multer
 * @param {string} folder - Cloudinary folder (e.g., 'bazarse/shops', 'bazarse/items')
 * @param {string} publicId - Optional custom public_id
 * @returns {Promise<{secure_url: string, public_id: string}>}
 */
const uploadToCloudinary = (buffer, folder = 'bazarse', publicId = null) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                public_id: publicId,
                resource_type: 'image',
                transformation: [
                    { quality: 'auto:good' },
                    { fetch_format: 'auto' }
                ]
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        secure_url: result.secure_url,
                        public_id: result.public_id
                    });
                }
            }
        );

        uploadStream.end(buffer);
    });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 * @returns {Promise<void>}
 */
const deleteFromCloudinary = async (publicId) => {
    if (!publicId) return;
    
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary deletion error:', error);
        // Don't throw - deletion failure shouldn't block updates
    }
};

/**
 * Extract public_id from Cloudinary URL
 * @param {string} url - Cloudinary secure_url
 * @returns {string|null} - public_id or null
 */
const extractPublicId = (url) => {
    if (!url || !url.includes('cloudinary.com')) return null;
    
    try {
        // Extract from URL pattern: .../upload/.../folder/publicId.ext
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;
        
        const pathParts = parts[1].split('/');
        // Remove version (v1234567890) if present
        const filteredParts = pathParts.filter(p => !p.startsWith('v'));
        
        // Get everything after transformations, remove file extension
        const fileName = filteredParts[filteredParts.length - 1];
        const publicIdWithFolder = filteredParts.slice(0, -1).concat(fileName.split('.')[0]).join('/');
        
        return publicIdWithFolder;
    } catch (error) {
        console.error('Error extracting public_id:', error);
        return null;
    }
};

module.exports = {
    cloudinary,
    uploadToCloudinary,
    deleteFromCloudinary,
    extractPublicId
};
