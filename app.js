import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/connection.js";
import path from "path";
import { fileURLToPath } from "url";

import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import attendanceRoute from "./routes/attendanceRoutes.js";
import userManagementRoute from "./routes/usermanagementRoutes.js";
import resultRoute from "./routes/resultRoutes.js";
import certificateRoute from "./routes/certificateRoutes.js";
import registrationroute from './routes/registrationRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ========== MIDDLEWARE ==========

// ✅ UPDATED: Allow both localhost and production domain
const allowedOrigins = [
  'http://localhost:4200',
  'https://portal.astaedu.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ UPDATED: Serve uploads with CORS headers for downloads
app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// ========== DATABASE CONNECTION ==========
connectDB();

const PORT = process.env.PORT || 3000;

// ========== ROOT ROUTE ==========
app.get("/", (req, res) => {
  res.json({
    message: "Student Management System API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      users: "/api/user",
      admin: "/api/admin",
      userManagement: "/api/manage",
      attendance: "/api/attendance",
      results: "/api/result",
      certificates: "/api/certificate",
      registrations: "/api/registration"
    }
  });
});

// ========== API ROUTES ==========
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/manage", userManagementRoute);
app.use("/api/attendance", attendanceRoute);
app.use("/api/result", resultRoute);
app.use("/api/certificate", certificateRoute);
app.use("/api/registration", registrationroute);

// ========== TEMPORARY FIX ROUTES ==========
app.get('/api/admin/fix-user-roles', async (req, res) => {
  try {
    const User = (await import('./models/userSchema.js')).default;
    
    const usersWithoutRole = await User.find({
      $or: [
        { role: { $exists: false } },
        { role: null },
        { role: undefined }
      ]
    });

    console.log(`Found ${usersWithoutRole.length} users without role`);

    const result = await User.updateMany(
      {
        $or: [
          { role: { $exists: false } },
          { role: null },
          { role: undefined }
        ]
      },
      { $set: { role: 'student' } }
    );

    const allUsers = await User.find({}).select('fullName email role admissionNumber');

    res.json({
      success: true,
      msg: 'User roles updated successfully',
      stats: {
        totalUsersUpdated: result.modifiedCount,
        usersFound: usersWithoutRole.length
      },
      users: allUsers.map(u => ({
        name: u.fullName,
        email: u.email,
        role: u.role,
        admissionNumber: u.admissionNumber
      }))
    });
  } catch (error) {
    console.error('Error fixing user roles:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ========== ERROR HANDLING ==========
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    requestedPath: req.path,
    method: req.method
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`\n🚀 ============================================`);
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`📍 API Base URL: http://localhost:${PORT}`);
  console.log(`🌐 CORS enabled for:`);
  console.log(`   - http://localhost:4200`);
  console.log(`   - https://portal.astaedu.com`);
  console.log(`\n📋 Available API Routes:`);
  console.log(`   - Attendance:    http://localhost:${PORT}/api/attendance`);
  console.log(`============================================\n`);
});
