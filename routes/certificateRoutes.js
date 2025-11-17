import express from "express";
import {
  getStudentsDetails,
  getStudentById,
  certificatStats
} from "../controllers/admin/adminCertificate.js";
import { getUserCertificate } from '../controllers/user/userCertificate.js';
import protect from "../middleware/userMiddleware.js";
import { uploadCertificateFile } from "../config/multer.js"; // Import certificate upload
import adminAuth from "../middleware/adminMiddleware.js"; // Import admin auth

const app = express.Router();

// ========== EXISTING ROUTES ==========
app.route("/").get(getStudentsDetails);
app.route("/students").get(protect, getUserCertificate);
app.route('/stats').get(certificatStats);
app.route('/:id').get(getStudentById);

// ========== NEW: FILE UPLOAD ROUTE ==========
// POST /api/certificate/upload - Upload certificate file
app.post('/upload', adminAuth, uploadCertificateFile.single('certificate'), async (req, res) => {
  try {
    console.log('📤 Certificate upload request received');
    console.log('   File:', req.file);
    console.log('   Body:', req.body);

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        msg: 'No file uploaded',
        success: false
      });
    }

    // Get form data
    const { studentId, issue } = req.body;

    // Validate required fields
    if (!studentId || !issue) {
      // Delete uploaded file if validation fails
      const fs = await import('fs');
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        msg: 'Student ID and issue date are required',
        success: false
      });
    }

    // Create certificate URL
    const certificateUrl = `${req.protocol}://${req.get('host')}/uploads/certificates/${req.file.filename}`;

    console.log('✅ File uploaded successfully');
    console.log('   Path:', req.file.path);
    console.log('   URL:', certificateUrl);

    // Import Certificate model
    const { default: Certificate } = await import('../models/certificateSchema.js');

    // Save certificate to database
    const certificate = new Certificate({
      studentId: studentId,
      certificateUrl: certificateUrl,
      issue: issue
    });

    await certificate.save();

    console.log('✅ Certificate saved to database');

    res.status(201).json({
      msg: 'Certificate uploaded successfully',
      success: true,
      data: {
        certificateUrl: certificateUrl,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        certificateId: certificate._id
      }
    });

  } catch (error) {
    console.error('❌ Error uploading certificate:', error);

    // Delete uploaded file if database save fails
    if (req.file) {
      const fs = await import('fs');
      const fsPromises = fs.promises;
      try {
        await fsPromises.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({
      msg: error.message || 'Failed to upload certificate',
      success: false
    });
  }
});

export default app;