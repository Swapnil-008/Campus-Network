import express from 'express';
import multer from 'multer';
import upload from '../config/upload.js';
import auth from '../middleware/auth.middleware.js';
import processImage from '../middleware/imageProcessor.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Wrapper to properly catch multer errors and pass them to the client
const handleUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ message: err.message });
    }
    if (err) {
      return res.status(400).json({ message: err.message || 'File upload failed' });
    }
    next();
  });
};

const handleMultiUpload = (req, res, next) => {
  upload.array('files', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ message: err.message });
    }
    if (err) {
      return res.status(400).json({ message: err.message || 'File upload failed' });
    }
    next();
  });
};

// @route   POST /api/upload
// @desc    Upload a file
// @access  Private
router.post('/', auth, handleUpload, processImage, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error during file upload' });
  }
});

// @route   POST /api/upload/multiple
// @desc    Upload multiple files
// @access  Private
router.post('/multiple', auth, handleMultiUpload, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`
    }));

    res.json(files);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error during file upload' });
  }
});

// @route   DELETE /api/upload/:filename
// @desc    Delete a file
// @access  Private
router.delete('/:filename', auth, (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(__dirname, '../uploads', filename);

    const uploadsDir = path.resolve(__dirname, '../uploads');
    if (!path.resolve(filePath).startsWith(uploadsDir)) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    fs.unlinkSync(filePath);

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error during file deletion' });
  }
});

export default router;