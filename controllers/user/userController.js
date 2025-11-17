import User from "../../models/userSchema.js";
import generateToken from "../../utils/generateToken.js";
import bcrypt from "bcryptjs";
import AsyncHandler from 'express-async-handler'

// ✅ USER SIGNUP
const userSignup = AsyncHandler(async (req, res) => {
  try {
    const { fullName, admissionNumber, email, dob, passportId, batch, password, confirmPassword } = req.body;

    // Validation
    if (!fullName || !admissionNumber || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        msg: 'All fields are required'
      });
    }

    // Password match check
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        msg: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        msg: 'Password must be at least 6 characters'
      });
    }

    // Check if user exists
    const existUser = await User.findOne({
      $or: [{ admissionNumber }, { email }]
    });

    if (existUser) {
      return res.status(400).json({
        success: false,
        msg: "User already exists"
      });
    }

    // Hash password with bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with hashed password
    const userDetails = await User.create({
      fullName,
      admissionNumber,
      email,
      dob,
      passportId,
      batch,
      password: hashedPassword,
      photo: req.file ? req.file.path : '',
      status: 'pending'
    });

    const token = generateToken(userDetails._id);

    res.status(201).json({
      success: true,
      msg: "Registration successful!",
      token,
      user: {
        id: userDetails._id,
        fullName: userDetails.fullName,
        email: userDetails.email,
        status: userDetails.status
      }
    });

  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({
      success: false,
      msg: "Error during signup",
      error: err.message,
    });
  }
});

// ✅ USER LOGIN
const userLogin = AsyncHandler(async (req, res) => {
  const { admissionNumber, password } = req.body;

  try {
    if (!admissionNumber || !password) {
      return res.status(400).json({
        success: false,
        msg: 'Admission number and password required'
      });
    }

    // Find user and explicitly select password field
    const existUser = await User.findOne({ admissionNumber }).select('+password');

    if (!existUser) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    // Compare passwords using bcryptjs
    const isMatch = await bcrypt.compare(password, existUser.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        msg: "Incorrect password"
      });
    }

    // Check if user is approved
    if (existUser.status !== 'approved') {
      return res.status(403).json({
        success: false,
        msg: `Account ${existUser.status}. Wait for admin approval.`
      });
    }

    res.status(200).json({
      success: true,
      msg: "Login successful",
      token: generateToken(existUser._id),
      user: {
        id: existUser._id,
        fullName: existUser.fullName,
        admissionNumber: existUser.admissionNumber,
        status: existUser.status
      }
    });

  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({
      success: false,
      msg: "Error during login",
      error: err.message,
    });
  }
});

// ✅ GET STUDENT PROFILE
const getStudentProfile = AsyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    console.log('📋 Fetching student profile for:', userId);

    const student = await User.findById(userId).select('-password');

    if (!student) {
      return res.status(404).json({
        success: false,
        msg: "Student not found"
      });
    }

    console.log('✅ Student profile fetched:', student.fullName);

    res.status(200).json({
      success: true,
      msg: "Student profile fetched successfully",
      data: student
    });

  } catch (err) {
    console.error("Error fetching student profile:", err.message);
    res.status(500).json({
      success: false,
      msg: "Error fetching student profile",
      error: err.message
    });
  }
});

// ✅ UPDATE USER DETAILS
const updateDetails = AsyncHandler(async (req, res) => {
  try {
    const id = req.user._id;

    console.log('✏️ Updating user details for:', id);
    console.log('   Data:', req.body);

    const updateUser = await User.findByIdAndUpdate(id, req.body, {
      new: true,
    }).select('-password');

    if (!updateUser) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    console.log('✅ User details updated:', updateUser.fullName);

    res.status(200).json({
      success: true,
      msg: "User details updated successfully",
      data: updateUser
    });
  } catch (err) {
    console.error("Error updating user details:", err.message);
    res.status(500).json({
      success: false,
      msg: "Error updating user details",
      error: err.message
    });
  }
});

// ✅ UPDATE STUDENT PROFILE
const updateStudentProfile = AsyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullName, dob, passportId, password } = req.body;

    console.log('✏️ Updating student profile for:', userId);

    const updateData = {
      fullName,
      dob,
      passportId
    };

    // ✅ If password is provided, hash it
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          msg: 'Password must be at least 6 characters'
        });
      }
      updateData.password = await bcrypt.hash(password, 10);
      console.log('   Password updated');
    }

    const updatedStudent = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        msg: "Student not found"
      });
    }

    console.log('✅ Student profile updated:', updatedStudent.fullName);

    res.status(200).json({
      success: true,
      msg: "Profile updated successfully",
      data: updatedStudent
    });

  } catch (err) {
    console.error("Error updating student profile:", err.message);
    res.status(500).json({
      success: false,
      msg: "Error updating profile",
      error: err.message
    });
  }
});

// ✅ GET USER BY ID
const getUserById = AsyncHandler(async (req, res) => {
  try {
    const id = req.user._id;

    const getDetails = await User.findById(id).select('-password');

    if (!getDetails) {
      return res.status(404).json({
        msg: "User not found"
      });
    }

    res.status(200).json({
      msg: "Details fetched successfully",
      data: getDetails
    });
  } catch (err) {
    console.error("error during fetching", err);
    res.status(500).json({
      msg: "Error fetching details",
      error: err.message
    });
  }
});

export { 
  userSignup, 
  userLogin, 
  getStudentProfile,
  updateDetails, 
  updateStudentProfile,
  getUserById 
};