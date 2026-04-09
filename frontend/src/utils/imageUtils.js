// Firebase storage imports removed; now using Cloudinary

/**
 * Compresses an image file using an HTML canvas and handles timeout/errors securely.
 * @param {File} file 
 * @param {number} maxWidth 
 * @param {number} maxHeight 
 * @returns {Promise<Blob>}
 */
export const compressImage = (file, maxWidth = 800, maxHeight = 800) => {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Image compression timed out.'));
        }, 15000); // 15 seconds timeout

        const reader = new FileReader();
        
        reader.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Failed to read image file.'));
        };

        reader.onload = (event) => {
            const img = new Image();
            
            img.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('Failed to load image for compression.'));
            };

            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        clearTimeout(timeout);
                        if (!blob) {
                            reject(new Error('Canvas to Blob failed.'));
                        } else {
                            resolve(blob);
                        }
                    }, 'image/jpeg', 0.8);
                } catch (error) {
                    clearTimeout(timeout);
                    reject(error);
                }
            };
            img.src = event.target.result;
        };

        reader.readAsDataURL(file);
    });
};

/**
 * Uploads a file to Cloudinary and returns the secure download URL.
 * Supports images, videos, audio, and documents.
 * @param {File} file - The file to upload.
 * @param {string} folder - The folder in Cloudinary.
 * @param {Object} options - Options containing maxWidth and maxHeight (for images).
 * @returns {Promise<string>} Download URL
 */
export const uploadFileToCloudinary = async (file, folder = 'stuverse_uploads', options = {}) => {
    if (!file) throw new Error("No file provided for upload.");

    const isImage = file.type.startsWith('image/');
    let fileToUpload = file;

    try {
        // If it's an image, we still want to compress it to save credits/bandwidth
        if (isImage) {
            const { maxWidth = 1200, maxHeight = 1200 } = options;
            fileToUpload = await compressImage(file, maxWidth, maxHeight);
        }

        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('upload_preset', 'stuverse_uploads');
        // Sending both to handle different Cloudinary API versions/presets
        formData.append('folder', folder);
        formData.append('asset_folder', folder);

        // Determine resource type: 'image', 'video', or 'raw'
        // 'auto' is the safest bet for a generic upload function
        const resourceType = 'auto';

        // Cloudinary Unsigned Upload API
        const response = await fetch(`https://api.cloudinary.com/v1_1/dwgherwne/${resourceType}/upload`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Cloudinary Upload Error:", data);
            throw new Error(data.error?.message || "Failed to upload to Cloudinary");
        }

        return data.secure_url;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw new Error(`Upload failed: ${error.message}`);
    }
};

/**
 * Legacy wrapper for compatibility with existing profile/community code.
 */
export const uploadImageToStorage = async (file, storagePath, options = {}) => {
    // Determine a reasonable folder from the storagePath if possible
    const folder = storagePath ? storagePath.split('/')[0] : 'stuverse_uploads';
    return uploadFileToCloudinary(file, folder, options);
};
