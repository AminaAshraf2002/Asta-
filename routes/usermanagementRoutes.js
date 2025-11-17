import express from "express";
import {
  verifyUser,
  rejectUser,
  studentStats,
  getAllUsers,
  getUserById,
  deleteUser,
  getUsersByBatch,
  pendingApprovalStats,
  getPendingStudents,
  getStudentDetailsAdmin,
  approveStudent,
  rejectStudentApproval,
  getApprovalStats,
} from "../controllers/admin/adminUsercontroller.js";
import adminProtect from "../middleware/adminMiddleware.js";

const app = express.Router();

// ========== STUDENT STATISTICS & MANAGEMENT ==========

// ✅ GET STUDENT STATS (no protection)
app.route('/').get(studentStats);

// ✅ GET ALL STUDENTS WITH PAGINATION - ADD adminProtect HERE
app.route("/students").get(adminProtect, getAllUsers);

// ✅ GET/DELETE SINGLE STUDENT
app.route("/students/:id")
  .get(adminProtect, getUserById)
  .delete(adminProtect, deleteUser);

// ========== USER VERIFICATION & REJECTION ==========

// ✅ VERIFY USER
app.route("/verify/:id").put(adminProtect, verifyUser);

// ✅ REJECT USER
app.route("/reject/:id").put(adminProtect, rejectUser);

// ========== APPROVAL ROUTES - NO PROTECTION (open routes) ==========

// ✅ CORRECT - WITH PROTECTION
app.get('/pending-students', adminProtect, getPendingStudents);
app.get('/student/:studentId', adminProtect, getStudentDetailsAdmin);
app.put('/approve-student/:studentId', adminProtect, approveStudent);
app.put('/reject-student/:studentId', adminProtect, rejectStudentApproval);
app.get('/approval-stats', adminProtect, getApprovalStats);

// ========== BATCH OPERATIONS - WILDCARD MUST BE LAST ==========

// ✅ GET USERS BY BATCH
app.route("/:batch").get(getUsersByBatch);

export default app;