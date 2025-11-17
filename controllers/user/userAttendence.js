import mongoose from "mongoose";
import Attendance from "../../models/attendenceSchema.js";
import User from "../../models/userSchema.js";

const getStudentAttendance = async (req, res) => {
    try {
        // ✅ ADD DETAILED LOGGING
        console.log('\n========== GET STUDENT ATTENDANCE ==========');
        console.log('📋 Request received');
        console.log('   Headers:', {
            authorization: req.headers.authorization ? 'Present' : 'Missing',
            token: req.headers.token ? 'Present' : 'Missing'
        });
        console.log('   req.user exists:', !!req.user);
        
        if (req.user) {
            console.log('   req.user details:', {
                id: req.user._id,
                name: req.user.fullName,
                role: req.user.role,
                email: req.user.email
            });
        }

        const userId = req.user?._id;

        if (!userId) {
            console.error('❌ No user ID found in req.user');
            return res.status(401).json({
                success: false,
                msg: "Unauthorized - No user ID found",
            });
        }

        console.log('✅ User ID extracted:', userId);

        const objectUserId = new mongoose.Types.ObjectId(userId);
        console.log('✅ ObjectId created:', objectUserId);

        const student = await User.findById(objectUserId);
        
        if (!student) {
            console.error('❌ Student not found in database for ID:', objectUserId);
            return res.status(404).json({
                success: false,
                msg: "Student not found in database",
            });
        }

        console.log('✅ Student found:', {
            id: student._id,
            name: student.fullName,
            role: student.role,
            admissionNumber: student.admissionNumber
        });

        // Fetch all attendance records where this user appears
        const records = await Attendance.find({
            "students.userId": objectUserId,
        }).lean();
        
        console.log(`📊 Found ${records.length} attendance records`);

        if (!records.length) {
            console.log('ℹ️ No attendance records found for student');
            return res.status(200).json({
                success: true,
                msg: "Student found, but no attendance records.",
                data: {
                    studentId: objectUserId,
                    fullName: student.fullName,
                    admissionNumber: student.admissionNumber,
                    batch: student.batch,
                    overallStats: { 
                        totalRecords: 0, 
                        presentCount: 0, 
                        absentCount: 0, 
                        attendancePercentage: "0.00" 
                    },
                    monthlyStats: []
                }
            });
        }

        // Initialize the structure for month-wise aggregation
        const monthlyAttendance = {};
        const monthNames = [
            "January", "February", "March", "April", "May", "June", 
            "July", "August", "September", "October", "November", "December"
        ];
        
        let overallPresentCount = 0;
        let overallAbsentCount = 0;

        records.forEach((record) => {
            const recordDate = record.date || record.createdAt;
            
            if (!recordDate) return;

            const monthIndex = recordDate.getMonth();
            const year = recordDate.getFullYear();
            const monthKey = `${monthNames[monthIndex]} ${year}`;

            const studentEntry = record.students.find(
                (s) => s.userId.toString() === objectUserId.toString()
            );

            if (studentEntry) {
                if (!monthlyAttendance[monthKey]) {
                    monthlyAttendance[monthKey] = {
                        presentCount: 0,
                        absentCount: 0,
                        totalRecords: 0,
                    };
                }

                if (studentEntry.status === "present") {
                    monthlyAttendance[monthKey].presentCount++;
                    overallPresentCount++;
                } else if (studentEntry.status === "absent") {
                    monthlyAttendance[monthKey].absentCount++;
                    overallAbsentCount++;
                }
                monthlyAttendance[monthKey].totalRecords++;
            }
        });

        // Calculate percentage for each month
        const monthlyStats = Object.keys(monthlyAttendance).map(monthKey => {
            const stats = monthlyAttendance[monthKey];
            const percentage = stats.totalRecords > 0
                ? ((stats.presentCount / stats.totalRecords) * 100).toFixed(2)
                : "0.00";

            return {
                month: monthKey,
                presentCount: stats.presentCount,
                absentCount: stats.absentCount,
                totalRecords: stats.totalRecords,
                attendancePercentage: percentage,
            };
        }).sort((a, b) => {
             const [monthA, yearA] = a.month.split(' ');
             const [monthB, yearB] = b.month.split(' ');
             const dateA = new Date(`${monthA} 1, ${yearA}`);
             const dateB = new Date(`${monthB} 1, ${yearB}`);
             return dateA - dateB;
        });

        const overallTotalRecords = overallPresentCount + overallAbsentCount;

        console.log('✅ Attendance data processed successfully');
        console.log('   Total records:', overallTotalRecords);
        console.log('   Present:', overallPresentCount);
        console.log('   Absent:', overallAbsentCount);
        console.log('   Monthly stats count:', monthlyStats.length);
        console.log('==========================================\n');

        res.status(200).json({
            success: true,
            msg: "Attendance fetched successfully",
            data: {
                studentId: objectUserId,
                fullName: student.fullName,
                admissionNumber: student.admissionNumber,
                batch: student.batch,
                overallStats: {
                    totalRecords: overallTotalRecords,
                    presentCount: overallPresentCount,
                    absentCount: overallAbsentCount,
                    attendancePercentage:
                        overallTotalRecords > 0
                            ? ((overallPresentCount / overallTotalRecords) * 100).toFixed(2)
                            : "0.00",
                },
                monthlyStats: monthlyStats,
            },
        });
    } catch (err) {
        console.error("❌ ERROR in getStudentAttendance:", err);
        console.error("   Error name:", err.name);
        console.error("   Error message:", err.message);
        console.error("   Stack:", err.stack);
        res.status(500).json({
            success: false,
            msg: "Internal server error",
            error: err.message,
        });
    }
};


const attendanceStudentStats = async(req,res) =>{
    try {
        console.log('\n========== GET STUDENT STATS ==========');
        console.log('📊 Request received for student stats');
        
        const studentId = req.user._id;
        console.log('   Student ID:', studentId);

        if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
            console.error('❌ Invalid student ID');
            return res.status(400).json({
                success: false,
                msg: "Invalid or missing student ID provided.",
            });
        }
        
        const objectUserId = new mongoose.Types.ObjectId(studentId);
        const student = await User.findById(objectUserId);

        if (!student) {
            console.error('❌ Student not found');
            return res.status(404).json({
                success: false,
                msg: "Student not found in database",
            });
        }

        console.log('✅ Student found:', student.fullName);

        const stats = await Attendance.aggregate([
            {
                $match: {
                    "students.userId": objectUserId
                }
            },
            {
                $unwind: "$students"
            },
            {
                $match: {
                    "students.userId": objectUserId
                }
            },
            {
                $group: {
                    _id: null,
                    presentCount: {
                        $sum: { $cond: [ { $eq: ["$students.status", "present"] }, 1, 0 ] }
                    },
                    absentCount: {
                        $sum: { $cond: [ { $eq: ["$students.status", "absent"] }, 1, 0 ] }
                    },
                    totalRecords: { $sum: 1 },
                }
            },
            {
                $project: {
                    _id: 0,
                    totalRecords: "$totalRecords",
                    presentCount: "$presentCount",
                    absentCount: "$absentCount",
                    attendancePercentage: {
                        $round: [
                            { $multiply: [{ $divide: ["$presentCount", "$totalRecords"] }, 100] },
                            2
                        ]
                    }
                }
            }
        ]);

        const overallStats = stats.length > 0 ? stats[0] : { 
            totalRecords: 0, 
            presentCount: 0, 
            absentCount: 0, 
            attendancePercentage: "0.00" 
        };

        console.log('✅ Stats calculated:', overallStats);
        console.log('======================================\n');

        res.status(200).json({
            success: true,
            msg: `Overall attendance statistics for student ${studentId} fetched successfully.`,
            data: {
                studentId: studentId,
                fullName: student.fullName,
                admissionNumber: student.admissionNumber,
                batch: student.batch,
                overallStats: overallStats,
            }
        });

    } catch (err) {
        console.error("❌ ERROR in attendanceStudentStats:", err);
        console.error("   Error message:", err.message);
        res.status(500).json({
            success: false,
            msg: "Internal server error during stats aggregation.",
            error: err.message,
        });
    }
}

export { getStudentAttendance, attendanceStudentStats };
