import express from 'express';
import { userSignup, userLogin, updateDetails, getUserById } from '../controllers/user/userController.js';
import { dashboardStats } from '../controllers/user/studentDashboard.js'
import protect from '../middleware/userMiddleware.js';
import { upload } from '../config/multer.js';
import User from '../models/userSchema.js';
import fs from 'fs';

const app = express.Router()

// ========== SIGNUP & LOGIN ==========

// ✅ IMPORTANT: upload.single('photo') MUST be before the handler
app.post('/', upload.single('photo'), userSignup)

app.post('/login', userLogin)

// ========== USER PROFILE ==========

app.get('/', protect, getUserById)

app.put('/', protect, updateDetails)

app.get('/dashboard', protect, dashboardStats)

// ========== PHOTO UPLOAD ==========

// ✅ PHOTO UPLOAD ENDPOINT
app.post('/upload-photo', protect, upload.single('photo'), async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('📸 Photo upload received');
    console.log('   User ID:', userId);
    console.log('   File:', req.file);

    // ✅ Check if file exists
    if (!req.file) {
      console.warn('⚠️ No file in request');
      return res.status(400).json({
        success: false,
        msg: 'No file uploaded'
      });
    }

    console.log('✅ File received:', req.file.filename);
    console.log('   File path:', req.file.path);
    console.log('   File size:', req.file.size);

    // ✅ Generate photo URL
    const photoUrl = `/uploads/${req.file.filename}`;

    // ✅ Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { photo: photoUrl },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      console.warn('⚠️ User not found');
      // Delete uploaded file if user not found
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    console.log('✅ User photo updated:', photoUrl);

    res.status(200).json({
      success: true,
      msg: 'Photo uploaded successfully',
      photo: photoUrl,
      data: updatedUser
    });

  } catch (error) {
    console.error('❌ Upload error:', error.message);
    
    // Delete uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Deleted uploaded file due to error');
      } catch (deleteError) {
        console.error('Error deleting file:', deleteError.message);
      }
    }

    res.status(500).json({
      success: false,
      msg: 'Failed to upload photo',
      error: error.message
    });
  }
});

// ========== EXPORT ==========

export default app
