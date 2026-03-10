/**
 * Client-side image compression utility.
 * Compresses images before upload using the Canvas API.
 * 
 * Benefits:
 * - Reduces upload size by 50–80% on typical product photos
 * - Faster uploads to Supabase Storage / Cloudinary
 * - No external dependencies
 */

const MAX_WIDTH = 1280;
const MAX_HEIGHT = 1280;
const DEFAULT_QUALITY = 0.8;

/**
 * Compresses an image File object.
 * @param {File} file - The original image file from an <input type="file">
 * @param {object} [options]
 * @param {number} [options.maxWidth=1280] - Maximum output width in pixels
 * @param {number} [options.maxHeight=1280] - Maximum output height in pixels
 * @param {number} [options.quality=0.8] - JPEG quality between 0 and 1
 * @returns {Promise<File>} Compressed image as a File object preserving the original name
 */
export const compressImage = (file, options = {}) => {
    const {
        maxWidth = MAX_WIDTH,
        maxHeight = MAX_HEIGHT,
        quality = DEFAULT_QUALITY
    } = options;

    return new Promise((resolve, reject) => {
        // If not an image, return original without compression
        if (!file || !file.type.startsWith('image/')) {
            resolve(file);
            return;
        }

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            let { width, height } = img;

            // Scale down proportionally if needed
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Output as JPEG for best compression (PNG files get converted)
            const outputType = file.type === 'image/png' ? 'image/jpeg' : file.type;

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        // Canvas compression failed — fall back to original
                        resolve(file);
                        return;
                    }
                    const compressed = new File([blob], file.name, {
                        type: outputType,
                        lastModified: Date.now()
                    });
                    resolve(compressed);
                },
                outputType,
                quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            // If load fails, return original file unchanged
            resolve(file);
        };

        img.src = objectUrl;
    });
};

export default compressImage;
