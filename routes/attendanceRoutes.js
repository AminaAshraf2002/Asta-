import express from 'express';
import {
  markAttendance,
  attendanceStats,
  getAllAttendance,
  fetchAttendanceById,
  updateAttendanceStatus
} from "../controllers/admin/adminAttendencecontroller.js";
import {
  getStudentAttendance,
  attendanceStudentStats
} from '../controllers/user/userAttendence.js';
import adminProtect from "../middleware/adminMiddleware.js";
import protect from '../middleware/userMiddleware.js';

const router = express.Router();

// ========== ADMIN ROUTES ==========
router.post("/mark", adminProtect, markAttendance);
router.get("/dashboard", adminProtect, attendanceStats);

// ✅ IMPORTANT: Put specific routes BEFORE dynamic routes!
// Student routes MUST come before /:id
router.get("/students", protect, getStudentAttendance);
router.get("/attendance-stats", protect, attendanceStudentStats);

// ✅ Dynamic routes LAST (/:id will match anything)
router.get("/", adminProtect, getAllAttendance);
router.get("/:id", adminProtect, fetchAttendanceById);
router.put("/:id", adminProtect, updateAttendanceStatus);

export default router;