import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Middleware that compresses uploaded images after multer saves them.
 * Resizes images wider than 1920px and compresses to 80% quality.
 * Non-image files are passed through unchanged.
 */
const processImage = async (req, res, next) => {
    if (!req.file) return next();

    // Only process images
    const imageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!imageTypes.includes(req.file.mimetype)) return next();

    try {
        const filePath = req.file.path;
        const ext = path.extname(req.file.filename);
        const compressedName = `compressed-${req.file.filename}`;
        const compressedPath = path.join(path.dirname(filePath), compressedName);

        let pipeline = sharp(filePath);

        // Get metadata to check dimensions
        const metadata = await pipeline.metadata();

        // Resize if wider than 1920px while maintaining aspect ratio
        if (metadata.width > 1920) {
            pipeline = pipeline.resize(1920, null, { withoutEnlargement: true });
        }

        // Compress based on format
        if (req.file.mimetype === 'image/png') {
            pipeline = pipeline.png({ quality: 80, compressionLevel: 8 });
        } else {
            pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
        }

        await pipeline.toFile(compressedPath);

        // Replace original with compressed
        fs.unlinkSync(filePath);
        fs.renameSync(compressedPath, filePath);

        // Update file size
        const stats = fs.statSync(filePath);
        req.file.size = stats.size;

        next();
    } catch (err) {
        console.error('Image processing error:', err);
        // Don't fail the upload if compression fails
        next();
    }
};

export default processImage;
