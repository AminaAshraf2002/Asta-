import mongoose from "mongoose";

const subjectMarksSchema = new mongoose.Schema({
  theory: { type: Number, required: true },
  practical: { type: Number, required: true },
  average: { type: Number, required: true },
  status: { type: String, enum: ["pass", "fail"], required: true },
});

const resultSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  examDate: {
    type: Date,
    required: true,
  },
  subjects: {
    basics_of_oil_and_gas: { type: subjectMarksSchema, required: true },
    how_to_work_in_a_rig: { type: subjectMarksSchema, required: true },
    rig_equipments_and_its_functions: {
      type: subjectMarksSchema,
      required: true,
    },
    documents_in_a_rig: { type: subjectMarksSchema, required: true },
    safety_in_rig: { type: subjectMarksSchema, required: true },
    soft_skill_development: { type: subjectMarksSchema, required: true },
  },
  overallPerformance: {
    type: Number,
    required: true,
  },
  totalSubjects: {
    type: Number,
    default: 6,
  },
  subjectsPassed: {
    type: Number,
    required: true,
  },
  subjectsFailed: {
    type: Number,
    required: true,
  },
});

const Result = mongoose.model("Result", resultSchema);
export default Result;
