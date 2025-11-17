import Result from "../../models/resultSchema.js";
import User from "../../models/userSchema.js";

const getUserResult = async (req, res) => {
  try {
    const id = req.user._id;
    const isStudent = await User.findById(id);
    if (!isStudent) {
      return res.status(404).json({
        msg: "invalid student id",
      });
    }
    const studentResult = await Result.find({
      studentId: isStudent.id,
    }).populate("studentId", "fullName admissionNumber batch");
    if (!studentResult) {
      return res.status(400).json({
        msg: "no data found",
      });
    }
    return res.status(200).json({
      msg: "student details fetched succesfully",
      data: studentResult,
    });
  } catch (err) {
    console.error("error during fetching data", err);
  }
};

export { getUserResult };
