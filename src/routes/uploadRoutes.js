import express from 'express';
import multer from 'multer';
import { uploadSingleFile, uploadMultipleFiles } from '../controllers/uploadController.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Single file upload endpoint
router.post('/', upload.single('file'), uploadSingleFile);

// Multiple files upload endpoint (max 10 files)
router.post('/multiple', upload.array('files', 10), uploadMultipleFiles);

export default router;
