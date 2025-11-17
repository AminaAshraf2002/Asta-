import express from "express";
import { addRegistration, getStudentRegistration } from "../controllers/user/userRegistration.js";
import { fetchAllStudents, fetchExamDetailsById, updateExamStatus, getExamStats } from "../controllers/admin/adminexamRegistartion.js";
import protect from "../middleWare/userMiddleWare.js";
import adminProtect from "../middleware/adminMiddleware.js";  // ✅ ADD THIS

const app = express.Router();

// ✅ STUDENT ROUTES - Protected by userMiddleware
app.route("/")
  .post(protect, addRegistration)      // ✅ Student registers for exam
  .get(protect, getStudentRegistration);  // ✅ Get student's registrations

// ✅ ADMIN ROUTES - Protected by adminMiddleware
app.route('/admin')
  .get(adminProtect, fetchAllStudents);  // ✅ Get all registrations

app.route('/admin-stats')
  .get(adminProtect, getExamStats);  // ✅ Get statistics

app.route('/admin/:id')
  .get(adminProtect, fetchExamDetailsById)  // ✅ Get registration by ID
  .put(adminProtect, updateExamStatus);     // ✅ Update status (approve/reject)

export default app;