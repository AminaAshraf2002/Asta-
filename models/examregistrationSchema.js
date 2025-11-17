import mongoose from "mongoose";

const examRegistrationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      required: true,
      default:'pending',
      enum: ["pending", "approved", "rejected"],
    },
  },
  {
    timestamps: true,
  }
);

const Exam = mongoose.model("Exam", examRegistrationSchema);
export default Exam;
