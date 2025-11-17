import Exam from "../../models/examregistrationSchema.js";

// ========== FETCH ALL STUDENTS (ADMIN) ==========
const fetchAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query; // ✅ Increased default limit

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    console.log('📋 Fetching exam registrations...');

    const totalStudents = await Exam.countDocuments();

    // ✅ FIX: Added .populate() to get student details
    const getDetails = await Exam.find()
      .populate('studentId', 'fullName admissionNumber batch course email') // ✅ CRITICAL FIX
      .skip(skip)
      .limit(limitNumber)
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${getDetails.length} registrations`);

    if (!getDetails.length) {
      // ✅ FIX: Return empty array with success:true instead of 404
      return res.status(200).json({
        success: true,
        msg: "No student exam details found",
        data: [],
        pagination: {
          totalStudents: 0,
          currentPage: pageNumber,
          totalPages: 0,
          pageSize: limitNumber,
        },
      });
    }

    // ✅ FIX: Added success:true
    return res.status(200).json({
      success: true, // ✅ ADDED THIS
      msg: "Student details fetched successfully",
      data: getDetails,
      pagination: {
        totalStudents,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalStudents / limitNumber),
        pageSize: limitNumber,
      },
    });
  } catch (err) {
    console.error("Error during fetching student exam details:", err);
    res.status(500).json({
      success: false,
      msg: "Internal server error",
      error: err.message,
    });
  }
};

// ========== FETCH EXAM DETAILS BY ID (ADMIN) ==========
const fetchExamDetailsById = async (req, res) => {
  try {
    const id = req.params.id;

    console.log('👁️ Fetching exam details for ID:', id);

    const getDetails = await Exam.findById(id).populate(
      "studentId",
      "fullName batch admissionNumber course email dob passportId"
    );

    if (!getDetails) {
      return res.status(404).json({
        success: false,
        msg: "No exam registration found with this ID",
      });
    }

    console.log('✅ Exam details found:', getDetails.studentId?.fullName);

    return res.status(200).json({
      success: true,
      msg: "Student details fetched successfully",
      data: getDetails,
    });
  } catch (err) {
    console.error("Error during fetching student exam details:", err);
    return res.status(500).json({
      success: false,
      msg: "Internal server error",
      error: err.message,
    });
  }
};

// ========== UPDATE EXAM STATUS (ADMIN) ==========
const updateExamStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`📝 Updating exam status for ID: ${id} to: ${status}`);

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid status. Use 'approved' or 'rejected'.",
      });
    }

    const exam = await Exam.findById(id).populate('studentId', 'fullName admissionNumber');
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        msg: "Exam registration not found",
      });
    }

    if (exam.status !== "pending") {
      return res.status(400).json({
        success: false,
        msg: `Cannot update because the current status is '${exam.status}'.`,
      });
    }

    exam.status = status;
    await exam.save();

    console.log(`✅ Exam status updated to: ${status} for ${exam.studentId?.fullName}`);

    return res.status(200).json({
      success: true,
      msg: `Exam registration ${status} successfully.`,
      data: exam,
    });
  } catch (err) {
    console.error("Error updating exam status:", err);
    return res.status(500).json({
      success: false,
      msg: "Internal server error",
      error: err.message,
    });
  }
};

// ========== GET EXAM STATISTICS (ADMIN) ==========
const getExamStats = async (req, res) => {
  try {
    console.log('📊 Fetching exam statistics...');

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const totalRegistrations = await Exam.countDocuments();
    const thisMonthRegistrations = await Exam.countDocuments({
      createdAt: { $gte: startOfMonth },
    });
    const approvedCount = await Exam.countDocuments({ status: "approved" });
    const pendingCount = await Exam.countDocuments({ status: "pending" });
    const rejectedCount = await Exam.countDocuments({ status: "rejected" });

    console.log('✅ Stats:', { totalRegistrations, approvedCount, pendingCount });

    res.status(200).json({
      success: true,
      msg: "Exam registration stats fetched successfully",
      data: {
        totalRegistrations,
        thisMonth: thisMonthRegistrations, // ✅ Changed to match frontend
        approvedCount,
        pendingCount,
        rejectedCount,
      },
    });
  } catch (err) {
    console.error("Error fetching exam stats:", err);
    res.status(500).json({
      success: false,
      msg: "Internal server error",
      error: err.message,
    });
  }
};

export { fetchAllStudents, fetchExamDetailsById, updateExamStatus, getExamStats };