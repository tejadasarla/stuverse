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
 * Uploads an image to Cloudinary and returns the secure download URL.
 * @param {File} file - The file to upload.
 * @param {string} storagePath - (Ignored) Legacy path from Firebase implementation.
 * @param {Object} options - Options containing maxWidth and maxHeight.
 * @returns {Promise<string>} Download URL
 */
export const uploadImageToStorage = async (file, storagePath, options = {}) => {
    if (!file) throw new Error("No file provided for upload.");
    
    // File size restriction before compression (e.g., 5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image must be less than 5MB");
    }

    const { maxWidth = 800, maxHeight = 800 } = options;

    try {
        // Compress the image before uploading
        const compressedBlob = await compressImage(file, maxWidth, maxHeight);
        
        // Prepare FormData for Cloudinary
        const formData = new FormData();
        formData.append('file', compressedBlob);
        formData.append('upload_preset', 'stuverse_uploads');

        // Cloudinary Unsigned Upload API
        // Cloud Name: dwgherwne
        const response = await fetch(`https://api.cloudinary.com/v1_1/dwgherwne/image/upload`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Cloudinary Upload Error:", data);
            throw new Error(data.error?.message || "Failed to upload image to Cloudinary");
        }

        // Return the secure URL provided by Cloudinary
        return data.secure_url;
    } catch (error) {
        console.error("Image Upload Error:", error);
        throw new Error(`Failed to upload image: ${error.message}`);
    }
};
