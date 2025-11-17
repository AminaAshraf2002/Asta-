import mongoose from "mongoose";
import User from "../../models/userSchema.js";
import Attendance from "../../models/attendenceSchema.js";
import Result from "../../models/resultSchema.js";
import Certificate from "../../models/certificateSchema.js";
import Exam from "../../models/examregistrationSchema.js";

const dashboardStats = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(401)
        .json({ success: false, msg: "Invalid or missing user ID" });
    }

    // Find student
    const student = await User.findById(userId);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, msg: "Student not found" });
    }

    //Fetch attendance data
    const attendanceRecords = await Attendance.find({
      "students.userId": userId,
    });

    let presentCount = 0;
    let absentCount = 0;

    attendanceRecords.forEach((record) => {
      const entry = record.students.find(
        (s) => s.userId.toString() === userId.toString()
      );
      if (entry) {
        if (entry.status === "present") presentCount++;
        else if (entry.status === "absent") absentCount++;
      }
    });

    const totalRecords = presentCount + absentCount;
    const attendancePercentage =
      totalRecords > 0
        ? ((presentCount / totalRecords) * 100).toFixed(2)
        : "0.00";

    //  Academic performance (overall status from Result)
    const results = await Result.find({ studentId: userId });

    let overallStatus = "No Results";
    if (results.length > 0) {
      // Calculate average percentage or decide based on pass/fail
      let totalMarks = 0;
      let totalSubjects = 0;
      let passCount = 0;

      results.forEach((r) => {
        if (r.totalMarks && r.maxMarks) {
          totalMarks += (r.totalMarks / r.maxMarks) * 100;
          totalSubjects++;
        }
        if (r.status === "pass") passCount++;
      });

      const avgPercentage =
        totalSubjects > 0 ? totalMarks / totalSubjects : 0;

      if (avgPercentage >= 90) overallStatus = "Excellent";
      else if (avgPercentage >= 75) overallStatus = "Good";
      else if (avgPercentage >= 50) overallStatus = "Average";
      else overallStatus = "Poor";
    }

    //  Certificates count
    const certificateCount = await Certificate.countDocuments({
      studentId: userId,
    });

    //  Latest exam registration status
    const latestExam = await Exam.findOne({ studentId: userId }).sort({
      createdAt: -1,
    });
    const examStatus = latestExam ? latestExam.status : "Not Registered";

    // ✅ FIXED: Changed exam_registarion_status to exam_registration_status
    return res.status(200).json({
      success: true,
      msg: "Dashboard data fetched successfully",
      data: {
        studentId: userId,
        fullName: student.fullName,
        batch: student.batch,
        attendance: {
          presentCount,
          absentCount,
          totalRecords,
          attendancePercentage,
        },
        academicStatus: overallStatus,
        certificateCount,
        exam_registration_status: examStatus, // ✅ FIXED: Was exam_registarion_status
      },
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({
      success: false,
      msg: "Internal server error",
      error: err.message,
    });
  }
};

export { dashboardStats };