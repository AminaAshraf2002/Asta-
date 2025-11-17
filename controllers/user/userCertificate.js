import Certificate from "../../models/certificateSchema.js";
import User from "../../models/userSchema.js";

const getUserCertificate = async (req, res) => {
    try {
        const id = req.user._id;
        
        // 1. Basic student check
        const isStudent = await User.findById(id);
        if (!isStudent) {
            return res.status(404).json({
                msg: "invalid student id",
            });
        }
        
        // 2. Fetch certificates and populate student details
        const getStudentCertificate = await Certificate.find({
            studentId: isStudent.id,
        })
        // 💡 FIX: Added 'course' to the populate fields so the frontend can display it.
        .populate("studentId", "fullName admissionNumber batch course"); 
        
        if (!getStudentCertificate || getStudentCertificate.length === 0) {
            return res.status(404).json({ // Using 404 for 'not found' is better practice here
                msg: "no certificates found for this student",
                data: [], // Send an empty array for clarity
            });
        }
        
        // 3. Success response
        return res.status(200).json({
            msg: "student details fetched succesfully",
            data: getStudentCertificate,
        });
    } catch (err) {
        console.error("❌ Error during fetching data:", err);
        return res.status(500).json({
            msg: "Internal server error occurred.",
        });
    }
};

export { getUserCertificate };