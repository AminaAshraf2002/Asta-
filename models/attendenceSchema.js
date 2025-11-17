import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    batch: {
      type: String,
      enum: ["Batch 1", "Batch 2", "Batch 3"],  // ✅ Change to uppercase
      required: true,
    },
    date: {
      type: Date,
      required: true,
      validate: {
        validator: (value) => value <= new Date(),
        message: "Future dates are not allowed",
      },
    },
    students: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["present", "absent"],
          default: "present",
        },
      },
    ],
    presentCount: {
      type: Number,
      required: true,
      default: 0,
    },
    absentCount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalStudents: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ batch: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
