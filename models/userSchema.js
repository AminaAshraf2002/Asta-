import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    admissionNumber: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    passportId: {
      type: String,
    },
    course: {
      type: String,
      enum: ["Oil and Gas"],
      default: "Oil and Gas",
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // Don't return password in queries by default
    },
    // ✅ ADDED: Role field for authentication
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    photo: {
      type: String,
      default: "",
    },
    batch: {
      type: String,
      enum: ["Batch 1", "Batch 2", "Batch 3"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// ✅ VIRTUAL for confirmPassword - only used during validation, not saved to DB
userSchema
  .virtual("confirmPassword")
  .set(function (value) {
    this._confirmPassword = value;
  })
  .get(function () {
    return this._confirmPassword;
  });

// ✅ METHOD: Compare passwords during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;