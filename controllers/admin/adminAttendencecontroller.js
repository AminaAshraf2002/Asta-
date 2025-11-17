import Attendance from "../../models/attendenceSchema.js";
import User from '../../models/userSchema.js'
import mongoose from "mongoose";

const markAttendance = async (req, res) => {
  try {
    const { batch, date, students } = req.body;

    console.log('📝 markAttendance received:');
    console.log('   Batch:', batch);
    console.log('   Date:', date);
    console.log('   Students count:', students?.length);

    if (!batch || !date || !students || students.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "Batch, date, and students are required.",
      });
    }

    // ✅ FIXED: Parse date properly
    let attendanceDate;
    try {
      attendanceDate = new Date(date);
      // Set time to midnight UTC for consistent date comparison
      attendanceDate = new Date(attendanceDate.getUTCFullYear(), attendanceDate.getUTCMonth(), attendanceDate.getUTCDate());
      console.log('   Parsed date:', attendanceDate);
    } catch (e) {
      console.error('   Date parsing error:', e);
      return res.status(400).json({
        success: false,
        msg: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    // ✅ FIXED: Check for existing attendance with proper date comparison
    const existingQuery = {
      batch: batch,
      date: {
        $gte: new Date(attendanceDate.getTime()),
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    };
    
    console.log('   Checking for existing attendance with query:', existingQuery);
    
    const existing = await Attendance.findOne(existingQuery);
    if (existing) {
      console.log('   ⚠️ Attendance already exists for this batch and date');
      return res.status(400).json({
        success: false,
        msg: "Attendance for this batch and date already exists.",
      });
    }

    console.log('   ✅ No existing attendance found');

    // ✅ Validate and process students
    const validStudents = [];
    for (const s of students) {
      if (!s.userId) {
        console.error('   ❌ Student missing userId:', s);
        return res.status(400).json({
          success: false,
          msg: "Each student must have a userId.",
        });
      }

      // ✅ Verify user exists
      const user = await User.findById(s.userId);
      if (!user) {
        console.error('   ❌ User not found:', s.userId);
        return res.status(400).json({
          success: false,
          msg: `Invalid userId: ${s.userId}. User not found.`,
        });
      }

      validStudents.push({
        userId: new mongoose.Types.ObjectId(s.userId),
        status: s.status || "present",
      });
    }

    console.log(`   ✅ All ${validStudents.length} students validated`);

    // Calculate counts
    const totalStudents = validStudents.length;
    const presentCount = validStudents.filter((s) => s.status === "present").length;
    const absentCount = validStudents.filter((s) => s.status === "absent").length;

    console.log('   Summary:');
    console.log('     Total:', totalStudents);
    console.log('     Present:', presentCount);
    console.log('     Absent:', absentCount);

    // ✅ Create attendance record
    const newAttendance = await Attendance.create({
      batch,
      date: attendanceDate,
      students: validStudents,
      totalStudents,
      presentCount,
      absentCount,
    });

    console.log('✅ Attendance record created:', newAttendance._id);

    res.status(201).json({
      success: true,
      msg: "Attendance added successfully",
      data: newAttendance,
    });
  } catch (err) {
    console.error("❌ Error adding attendance:", err);
    console.error("   Message:", err.message);
    console.error("   Stack:", err.stack);
    
    res.status(500).json({
      success: false,
      msg: "Internal server error",
      error: err.message,
    });
  }
};

const fetchAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findById(id).populate(
      "students.userId",
      "fullName admissionNumber"
    );

    if (!attendance) {
      return res.status(404).json({
        success: false,
        msg: "Attendance record not found",
      });
    }

    res.status(200).json({
      success: true,
      msg: "Attendance fetched successfully",
      data: attendance,
    });
  } catch (err) {
    console.error("Error fetching user attendance:", err);
    res.status(500).json({
      success: false,
      msg: "Internal server error",
      error: err.message,
    });
  }
};

const attendanceStats = async (req, res) => {
  try {
    const totalDocuments = await Attendance.countDocuments();

    const stats = await Attendance.aggregate([
      {
        $group: {
          _id: null,
          totalPresent: { $sum: "$presentCount" },
          totalAbsent: { $sum: "$absentCount" },
          totalStudents: { $sum: "$totalStudents" }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.status(200).json({
        success: true,
        totalDocuments: 0,
        totalAbsent: 0,
        averageAttendance: 0
      });
    }

    const { totalPresent, totalAbsent, totalStudents } = stats[0];

    const averageAttendance =
      totalStudents > 0
        ? ((totalPresent / totalStudents) * 100).toFixed(2)
        : 0;

    res.status(200).json({
      success: true,
      totalDocuments,
      totalAbsent,
      averageAttendance: `${averageAttendance}%`
    });
  } catch (err) {
    console.error("Error during fetching attendance stats:", err);
    res.status(500).json({
      success: false,
      msg: "Internal server error",
      error: err.message
    });
  }
};


const getAllAttendance = async (req, res) => {
  try {
    let { page = 1, limit = 10, batch, date } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const filter = {};
    if (batch) filter.batch = batch;
    if (date) filter.date = new Date(date);
    const totalRecords = await Attendance.countDocuments(filter);
    const attendanceRecords = await Attendance.find(filter)
      .populate("students.userId", "fullName admissionNumber")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const formattedRecords = attendanceRecords.map((record) => {
      const totalStudents = record.students.length;
      const presentCount = record.students.filter(
        (s) => s.status === "present"
      ).length;
      const absentCount = totalStudents - presentCount;

      return {
        _id: record._id,
        batch: record.batch,
        date: record.date,
        totalStudents,
        presentCount,
        absentCount,
        students: record.students.map((s) => ({
          userId: s.userId?._id,
          name: s.userId?.fullName,
          admissionNumber: s.userId?.admissionNumber,
          status: s.status,
        })),
      };
    });

    res.status(200).json({
      success: true,
      msg: "Attendance fetched successfully",
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
      results: formattedRecords.length,
      data: formattedRecords,
    });
  } catch (err) {
    console.error("Error fetching attendance records:", err);
    res.status(500).json({
      success: false,
      msg: "Internal server error",
      error: err.message,
    });
  }
};

const updateAttendanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { students } = req.body; 
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "Students array with userId and status is required",
      });
    }

    const attendanceRecord = await Attendance.findById(id);
    if (!attendanceRecord) {
      return res.status(404).json({
        success: false,
        msg: "Attendance record not found",
      });
    }

    // Update each student
    students.forEach((s) => {
      const student = attendanceRecord.students.find(
        (st) => st.userId.toString() === s.userId
      );
      if (student) {
        student.status = s.status;
      }
    });

    // Recalculate counts
    attendanceRecord.presentCount = attendanceRecord.students.filter(
      (s) => s.status === "present"
    ).length;

    attendanceRecord.absentCount = attendanceRecord.students.filter(
      (s) => s.status === "absent"
    ).length;

    await attendanceRecord.save();

    return res.status(200).json({
      success: true,
      msg: "Student statuses updated successfully",
      data: attendanceRecord,
    });
  } catch (err) {
    console.error("Error updating attendance:", err);
    return res.status(500).json({
      success: false,
      msg: "Internal server error",
      error: err.message,
    });
  }
};




export { markAttendance,fetchAttendanceById,attendanceStats,getAllAttendance,updateAttendanceStatus };