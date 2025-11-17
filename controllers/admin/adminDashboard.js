import User from "../../models/userSchema.js";
import Exam from "../../models/examregistrationSchema.js";
import Attendance from "../../models/attendenceSchema.js";
import Certificate from "../../models/certificateSchema.js";

const adminDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments();

    const pendingStudents = await User.countDocuments({ status: "pending" });
    const approvedStudents = await User.countDocuments({ status: "approved" });

    const latestApprovedStudent = await User.findOne({ status: "approved" })
      .sort({ createdAt: -1 })
      .select("fullName admissionNumber batch");

    const examRegisteredApprovedCount = await Exam.countDocuments({
      status: "approved",
    });
    const latestAttendance = await Attendance.findOne().sort({ createdAt: -1 });

    let latestBatch = "No attendance marked yet";
    let presentCount = 0;

    if (latestAttendance) {
      latestBatch = latestAttendance.batch || "Unknown Batch";
      presentCount = latestAttendance.students?.filter(
        (s) => s.status === "present"
      ).length || 0;
    }

    const totalCertificates = await Certificate.countDocuments();

    return res.status(200).json({
      success: true,
      msg: "Admin dashboard stats fetched successfully",
      data: {
        totalStudents,
        pendingStudents,
        approvedStudents,
        latestApprovedStudent: latestApprovedStudent || null,
        examRegisteredApprovedCount,
        latestBatch,
        presentCount,
        totalCertificates,
      },
    });
  } catch (err) {
    console.error("Error during fetching admin dashboard stats:", err);
    return res.status(500).json({
      success: false,
      msg: "Internal server error",
      error: err.message,
    });
  }
};

export { adminDashboardStats };
