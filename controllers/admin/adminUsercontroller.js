import User from "../../models/userSchema.js";
import { sendStudentApprovalEmail, sendStudentRejectionEmail } from "../../services/emailService.js";

const verifyUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { isVerified } = req.body;
    const updateUser = await User.findByIdAndUpdate(
      id,
      { isVerified },
      { new: true }
    );
    if (!updateUser) {
      return res.status(404).json({ success: false, msg: "student not found" });
    }

    res.status(200).json({
      success: true,
      msg: "student verification status updated successfully",
      updateUser,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Error updating student verification",
      error: err.message,
    });
  }
};

// ✅ UPDATED: getAllUsers with pagination, batch filter, role filter, and proper response
const getAllUsers = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, batch = '', role } = req.query; // ✅ Added role parameter
    
    console.log('📋 Getting all users');
    console.log('   Page:', page);
    console.log('   Limit:', limit);
    console.log('   Batch:', batch || 'All');
    console.log('   Status:', status || 'All');
    console.log('   Role:', role || 'All'); // ✅ Log role filter

    let query = {};

    // ✅ ROLE FILTER (for Results Management - getting students)
    if (role) {
      query.role = role;
      console.log('   ✅ Filtering by role:', role);
    }

    // ✅ STATUS FILTER (only apply if not filtering by role)
    if (status) {
      query.status = status;
    } else if (!role) {
      // Only exclude rejected/pending if not specifically filtering by role
      query.status = { $nin: ["rejected", "pending"] };
    }

    // ✅ BATCH FILTER
    if (batch) {
      query.batch = batch;
      console.log('   Filtering by batch:', batch);
    }

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;

    const skip = (pageNumber - 1) * limitNumber;

    const totalUsers = await User.countDocuments(query);

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limitNumber)
      .sort({ createdAt: -1 });

    console.log(`✅ Fetched ${users.length} users out of ${totalUsers} total`);

    // ✅ Log sample user if available
    if (users.length > 0) {
      console.log('📝 Sample user:', {
        id: users[0]._id,
        name: users[0].fullName,
        role: users[0].role,
        admission: users[0].admissionNumber
      });
    }

    // ✅ ALWAYS RETURN SUCCESS (don't return 404)
    res.status(200).json({
      success: true,
      msg: "Users fetched successfully",
      data: users,
      pagination: {
        totalUsers,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalUsers / limitNumber),
        pageSize: limitNumber,
      },
    });
  } catch (err) {
    console.error("Internal error", err);
    res.status(500).json({
      success: false,
      msg: "Internal server error",
      error: err.message
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    const getEachUsers = await User.findOne({ _id: id });
    if (!getEachUsers) {
      return res.status(400).json({
        msg: "invalid student id",
      });
    }
    return res.status(200).json({
      msg: "student details fetched successfully",
      data: getEachUsers,
    });
  } catch (err) {
    console.error("error during fetching the student details", err);
  }
};

const getUsersByBatch = async (req, res) => {
  try {
    const { batch } = req.params;

    const users = await User.find({ batch });

    if (!users.length) {
      return res.status(404).json({
        success: false,
        msg: "No students found for this batch",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Students fetched successfully",
      data: users,
    });
  } catch (err) {
    console.error("Error fetching users by batch:", err);
    res.status(500).json({
      success: false,
      msg: "Internal server error",
      error: err.message,
    });
  }
};

const rejectUser = async (req, res) => {
  try {
    const id = req.params.id;

    const removeUser = await User.findByIdAndUpdate(
      id,
      { status: "rejected" },
      { new: true }
    );

    if (!removeUser) {
      return res.status(404).json({
        success: false,
        msg: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      msg: "Student rejected successfully",
      data: removeUser,
    });
  } catch (err) {
    console.error("Error during user rejection", err);
    res.status(500).json({
      success: false,
      msg: "Internal server error",
      error: err.message,
    });
  }
};

const pendingApprovalStats = async (req, res) => {
  try {
    //  Get total counts for each status
    const statusStats = await User.aggregate([
      {
        $group: {
          _id: "$status", // group by status field
          count: { $sum: 1 }, // count how many users in each status
        },
      },
    ]);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayStats = await User.aggregate([
      {
        $match: {
          updatedAt: { $gte: startOfDay, $lte: endOfDay },
          status: { $in: ["approved", "rejected"] }, 
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      approved: 0,
      pending: 0,
      rejected: 0,
      approvedToday: 0,
      rejectedToday: 0,
    };

    statusStats.forEach((item) => {
      formattedStats[item._id] = item.count;
    });

    todayStats.forEach((item) => {
      if (item._id === "approved") formattedStats.approvedToday = item.count;
      if (item._id === "rejected") formattedStats.rejectedToday = item.count;
    });

    //  Send response
    res.status(200).json({
      success: true,
      msg: "User status statistics fetched successfully",
      data: formattedStats,
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({
      success: false,
      msg: "Internal server error",
      error: err.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const removeUser = await User.findByIdAndDelete(id);
    
    if (!removeUser) {
      return res.status(404).json({
        success: false,
        msg: "student not found",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "student details deleted successfully",
    });
  } catch (err) {
    console.error("error during fetching the details", err);
    res.status(500).json({
      success: false,
      msg: "Error deleting student",
      error: err.message,
    });
  }
};

const studentStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments();
    const batch = 3

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const newThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    res.status(200).json({
      success: true,
      msg: "Student statistics fetched successfully",
      stats: {
        totalStudents,
        newThisMonth,
        batch
      },
    });
  } catch (err) {
    console.error("Error fetching student stats:", err);
    res.status(500).json({
      success: false,
      msg: "Error fetching student statistics",
      error: err.message,
    });
  }
};

// ✅ GET ALL PENDING STUDENTS FOR APPROVAL
const getPendingStudents = async (req, res) => {
  try {
    console.log('📋 Fetching pending students...');
    
    const pendingStudents = await User.find({ status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${pendingStudents.length} pending students`);

    res.status(200).json({
      success: true,
      msg: "Pending students fetched successfully",
      data: pendingStudents
    });
  } catch (err) {
    console.error('❌ Error fetching pending students:', err.message);
    res.status(500).json({
      success: false,
      msg: "Error fetching pending students",
      error: err.message
    });
  }
};

// ✅ GET SINGLE STUDENT DETAILS
const getStudentDetailsAdmin = async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log('📋 Fetching student details for:', studentId);

    const student = await User.findById(studentId).select('-password');

    if (!student) {
      return res.status(404).json({
        success: false,
        msg: "Student not found"
      });
    }

    res.status(200).json({
      success: true,
      msg: "Student details fetched successfully",
      data: student
    });
  } catch (err) {
    console.error('❌ Error fetching student:', err.message);
    res.status(500).json({
      success: false,
      msg: "Error fetching student details",
      error: err.message
    });
  }
};

// ✅ APPROVE STUDENT - WITH EMAIL NOTIFICATION
const approveStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log('✅ Approving student:', studentId);

    const student = await User.findByIdAndUpdate(
      studentId,
      { 
        status: 'approved',      // ✅ Set status to approved
        isVerified: true         // ✅ Mark as verified so they can login
      },
      { new: true }
    ).select('-password');

    if (!student) {
      return res.status(404).json({
        success: false,
        msg: "Student not found"
      });
    }

    console.log('✅ Student approved:', student.fullName);
    console.log('   Status:', student.status);
    console.log('   Is Verified:', student.isVerified);
    console.log('   Sending email to:', student.email);

    // ✅ SEND APPROVAL EMAIL
    try {
      await sendStudentApprovalEmail(student.email, student.fullName, student.admissionNumber);
      console.log('✅ Approval email sent successfully to:', student.email);
    } catch (emailErr) {
      console.error('⚠️ Email sending failed:', emailErr.message);
      // Don't fail the approval if email fails, just log the warning
    }

    res.status(200).json({
      success: true,
      msg: `${student.fullName} has been approved! Approval email sent to ${student.email}`,
      data: student
    });
  } catch (err) {
    console.error('❌ Error approving student:', err.message);
    res.status(500).json({
      success: false,
      msg: "Error approving student",
      error: err.message
    });
  }
};

// ✅ REJECT STUDENT - WITH EMAIL NOTIFICATION
const rejectStudentApproval = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { reason } = req.body;
    
    console.log('❌ Rejecting student:', studentId);
    console.log('   Reason:', reason);

    const student = await User.findByIdAndUpdate(
      studentId,
      { 
        status: 'rejected',
        rejectionReason: reason || 'No reason provided'
      },
      { new: true }
    ).select('-password');

    if (!student) {
      return res.status(404).json({
        success: false,
        msg: "Student not found"
      });
    }

    console.log('✅ Student rejected:', student.fullName);
    console.log('   Sending rejection email to:', student.email);

    // ✅ SEND REJECTION EMAIL
    try {
      await sendStudentRejectionEmail(student.email, student.fullName, reason);
      console.log('✅ Rejection email sent successfully to:', student.email);
    } catch (emailErr) {
      console.error('⚠️ Email sending failed:', emailErr.message);
      // Don't fail the rejection if email fails, just log the warning
    }

    res.status(200).json({
      success: true,
      msg: `${student.fullName} has been rejected. Rejection email sent to ${student.email}`,
      data: student
    });
  } catch (err) {
    console.error('❌ Error rejecting student:', err.message);
    res.status(500).json({
      success: false,
      msg: "Error rejecting student",
      error: err.message
    });
  }
};

// ✅ GET APPROVAL STATISTICS
const getApprovalStats = async (req, res) => {
  try {
    console.log('📊 Fetching approval statistics...');

    const pending = await User.countDocuments({ status: 'pending' });
    const approved = await User.countDocuments({ status: 'approved' });
    const rejected = await User.countDocuments({ status: 'rejected' });

    // Get today's approvals and rejections
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const approvedToday = await User.countDocuments({
      status: 'approved',
      updatedAt: { $gte: today }
    });

    const rejectedToday = await User.countDocuments({
      status: 'rejected',
      updatedAt: { $gte: today }
    });

    const stats = {
      pending,
      approved,
      rejected,
      approvedToday,
      rejectedToday
    };

    console.log('✅ Stats:', stats);

    res.status(200).json({
      success: true,
      msg: "Statistics fetched successfully",
      data: stats
    });
  } catch (err) {
    console.error('❌ Error fetching stats:', err.message);
    res.status(500).json({
      success: false,
      msg: "Error fetching statistics",
      error: err.message
    });
  }
};

export {
  verifyUser,
  rejectUser,
  studentStats,
  getAllUsers,
  getUserById,
  deleteUser,
  pendingApprovalStats,
  getUsersByBatch,
  // ✅ APPROVAL FUNCTIONS
  getPendingStudents,
  getStudentDetailsAdmin,
  approveStudent,
  rejectStudentApproval,
  getApprovalStats
};