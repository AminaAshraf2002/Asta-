import mongoose from "mongoose";
import Exam from "../../models/examregistrationSchema.js";
import User from "../../models/userSchema.js";
import AsyncHandler from 'express-async-handler';

// ✅ ADD EXAM REGISTRATION - PROTECTED
const addRegistration = AsyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        msg: "Unauthorized - No user ID found" 
      });
    }

    // Verify student exists
    const student = await User.findById(userId);
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        msg: "Student not found" 
      });
    }

    // Check if already registered for exam
    const existingRegistration = await Exam.findOne({ studentId: userId });

    if (existingRegistration) {
      if (existingRegistration.status === "pending" || existingRegistration.status === "approved") {
        return res.status(400).json({
          success: false,
          msg: "You have already registered or waiting for admin approval",
        });
      }
    }

    // Create new exam registration
    const newRegistration = await Exam.create({
      studentId: new mongoose.Types.ObjectId(userId),
    });

    res.status(201).json({
      success: true,
      msg: "Exam registration completed successfully",
      data: newRegistration,
    });

  } catch (err) {
    console.error("Error during exam registration:", err);
    res.status(500).json({
      success: false,
      msg: "Internal server error",
      error: err.message,
    });
  }
});

// ✅ GET STUDENT REGISTRATION - PROTECTED
const getStudentRegistration = AsyncHandler(async (req, res) => {
  try {
    const id = req.user._id;

    // Verify student exists
    const isStudent = await User.findById(id);
    
    if (!isStudent) {
      return res.status(401).json({
        success: false,
        msg: "Invalid user ID"
      });
    }

    // ✅ FIXED: Changed isStudent.id to isStudent._id
    const getStudentDetails = await Exam.find({ studentId: isStudent._id })
      .populate("studentId", "fullName admissionNumber batch");

    return res.status(200).json({
      success: true,
      msg: "Student details fetched successfully",
      data: getStudentDetails
    });

  } catch (err) {
    console.error("Error during fetching student registration data:", err);
    // ✅ FIXED: Added error response in catch block
    return res.status(500).json({
      success: false,
      msg: "Error fetching student registration details",
      error: err.message
    });
  }
});

export { addRegistration, getStudentRegistration };