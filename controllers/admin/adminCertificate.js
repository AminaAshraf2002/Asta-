import Certificate from "../../models/certificateSchema.js";
import User from "../../models/userSchema.js";

const uploadCertificate = async (req, res) => {
  try {
    const { studentId, certificateUrl } = req.body;
    if (!studentId || !certificateUrl) {
      return res.status(400).json({
        msg: "studentId and certificateUrl are required",
      });
    }
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ msg: "Student not found" });

    const newCertificate = await Certificate.create(req.body);

    return res.status(201).json({
      msg: "Certificate uploaded successfully",
      data: newCertificate,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Error uploading certificate",
      error: error.message,
    });
  }
};

const getStudentsDetails = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // default page 1, 10 students per page

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Get total count for pagination metadata
    const totalStudents = await Certificate.countDocuments();

    // Fetch paginated student data
    const CertificateIssuedStudents = await Certificate.find()
      .populate("studentId", "fullName admissionNumber batch")
      .skip(skip)
      .limit(limitNumber)
      .sort({ createdAt: -1 }); // optional: latest first

    if (!CertificateIssuedStudents.length) {
      return res.status(404).json({
        msg: "No data found",
      });
    }

    return res.status(200).json({
      msg: "Details fetched successfully",
      data: CertificateIssuedStudents,
      pagination: {
        totalStudents,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalStudents / limitNumber),
        pageSize: limitNumber,
      },
    });
  } catch (err) {
    console.error("Internal error", err);
    res.status(500).json({
      msg: "Error fetching certificate details",
      error: err.message,
    });
  }
};


const getStudentById = async (req, res) => {
  try {
    const id = req.params.id;
    const getCertificate = await Certificate.findById(id).populate(
      "studentId",
      "fullName admissionNumber batch"
    );
    if (!getCertificate) {
      return res.status(400).json({
        msg: "error during fetching the student certificate",
      });
    }
    return res.status(200).json({
      msg: "details fetched successfully",
      data: getCertificate,
    });
  } catch (err) {
    console.error(err);
  }
};

const certificatStats = async (req, res) => {
  try {
    // 1️⃣ Total certificates
    const totalCertificates = await Certificate.countDocuments();

    // 2️⃣ Certificates issued this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const issuedThisMonth = await Certificate.countDocuments({
      issue: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // 3️⃣ Total students
    const totalStudents = await User.countDocuments();

    // 4️⃣ Last generated (latest issued certificate date)
    const latestCertificate = await Certificate.findOne()
      .sort({ issue: -1 })
      .select("issue");

    res.status(200).json({
      msg: "Certificate statistics fetched successfully",
      stats: {
        totalCertificates,
        issuedThisMonth,
        totalStudents,
        lastGeneratedDate: latestCertificate ? latestCertificate.issue : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      msg: "Error fetching certificate statistics",
      error: error.message,
    });
  }
};

export { uploadCertificate, getStudentsDetails, getStudentById,certificatStats };
