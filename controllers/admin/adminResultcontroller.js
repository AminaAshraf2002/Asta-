import Result from "../../models/resultSchema.js";
import User from "../../models/userSchema.js";

const addResult = async (req, res) => {
  try {
    const { studentId, examDate, subjects } = req.body;

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(400).json({ msg: "Invalid student ID" });
    }

    const existingResult = await Result.findOne({ studentId, examDate });
    if (existingResult) {
      return res.status(400).json({
        msg: "Student result already recorded for this date",
      });
    }

    let totalSubjects = 6;
    let subjectsPassed = 0;
    let subjectsFailed = 0;

    const processedSubjects = {};

    for (const [subject, marks] of Object.entries(subjects)) {
      const theory = marks.theory || 0;
      const practical = marks.practical || 0;
      const average = parseFloat(((theory + practical) / 2).toFixed(2));
      const status = average >= 40 ? "pass" : "fail"; 

      processedSubjects[subject] = {
        theory,
        practical,
        average,
        status,
      };

      if (status === "pass") subjectsPassed++;
      else subjectsFailed++;
    }

    const totalAverage =
      Object.values(processedSubjects).reduce((sum, s) => sum + s.average, 0) /
      totalSubjects;

    const overallPerformance = parseFloat(totalAverage.toFixed(2));

    const newResult = await Result.create({
      studentId,
      examDate,
      subjects: processedSubjects,
      overallPerformance,
      totalSubjects,
      subjectsPassed,
      subjectsFailed,
    });

    return res.status(201).json({
      msg: "Student result successfully created",
      data: newResult,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Server error while creating student result",
      error: error.message,
    });
  }
};

const getAllResults = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const totalResults = await Result.countDocuments();

    const getResults = await Result.find()
      .populate("studentId", "fullName admissionNumber batch")
      .skip(skip)
      .limit(limitNumber)
      .sort({ createdAt: -1 }); 

    if (!getResults.length) {
      return res.status(404).json({
        msg: "No results found",
      });
    }

    return res.status(200).json({
      msg: "Details fetched successfully",
      data: getResults,
      pagination: {
        totalResults,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalResults / limitNumber),
        pageSize: limitNumber,
      },
    });
  } catch (err) {
    console.error("Internal error", err);
    res.status(500).json({
      msg: "Internal server error",
    });
  }
};


const getResultsById = async (req, res) => {
  try {
    const id = req.params.id;
    const getResults = await Result.findById(id).populate(
      "studentId",
      "fullName batch admissionNumber"
    );
    if (getResults) {
      return res.status(200).json({
        msg: "student details fetched successfully",
        data: getResults,
      });
    }
    return res.status(400).json({
      msg: "invalid id",
    });
  } catch (err) {
    err;
  }
};

const updateResults = async (req, res) => {
  try {
    const { id } = req.params;
    const { subjects } = req.body;

    if (!subjects || Object.keys(subjects).length === 0) {
      return res.status(400).json({ msg: "Subjects data is required" });
    }

    // Get subject name dynamically
    const subjectName = Object.keys(subjects)[0];
    const { theory, practical } = subjects[subjectName];

    if (theory == null || practical == null) {
      return res
        .status(400)
        .json({ msg: "Both theory and practical marks are required" });
    }

    // Calculate average and status
    const average = (theory + practical) / 2;
    const status = average >= 40 ? "pass" : "fail";

    // Build updated subject object
    const updatedSubject = { theory, practical, average, status };

    // Update the specific subject
    const updatedResult = await Result.findByIdAndUpdate(
      id,
      { $set: { [`subjects.${subjectName}`]: updatedSubject } },
      { new: true }
    );

    if (!updatedResult) {
      return res.status(404).json({ msg: "Result not found" });
    }

    // 🔹 Recalculate overall performance, subjectsPassed, and subjectsFailed
    const allSubjects = Object.values(updatedResult.subjects);
    const subjectsPassed = allSubjects.filter(
      (s) => s.status === "pass"
    ).length;
    const subjectsFailed = allSubjects.filter(
      (s) => s.status === "fail"
    ).length;

    const overallPerformance =
      allSubjects.reduce((sum, s) => sum + s.average, 0) / allSubjects.length;

    updatedResult.subjectsPassed = subjectsPassed;
    updatedResult.subjectsFailed = subjectsFailed;
    updatedResult.overallPerformance = overallPerformance;

    await updatedResult.save();

    res.status(200).json({
      msg: `${subjectName} marks updated successfully`,
      data: updatedResult,
    });
  } catch (err) {
    console.error("Error during updating:", err);
    res.status(500).json({
      msg: "Server error while updating result",
      error: err.message,
    });
  }
};

const resultStats = async (req, res) => {
  try {
    const totalStudents = await Result.countDocuments();
    const countStats = await Result.aggregate([
      {
        $group: {
          _id: null,
          totalSubjectsPassed: { $sum: "$subjectsPassed" },
          totalSubjectsFailed: { $sum: "$subjectsFailed" },
        },
      },
    ]);
    const { totalSubjectsPassed = 0, totalSubjectsFailed = 0 } = countStats[0] || {};
    res.status(200).json({
      msg: "Results statistics fetched successfully",
      data: {
        totalStudents,
        totalSubjectsPassed,
        totalSubjectsFailed,
      },
    });
  } catch (err) {
    console.error("Error fetching result stats:", err);
    res.status(500).json({
      msg: "Server error while fetching result stats",
      error: err.message,
    });
  }
};

export { addResult, getAllResults, getResultsById, updateResults, resultStats };
