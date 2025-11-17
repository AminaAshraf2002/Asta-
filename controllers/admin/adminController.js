import Admin from "../../models/adminSchema.js";
import generateToken from "../../utils/generateToken.js";

const adminSignup = async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ userName }, { email }]
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        msg: "Admin with this username or email already exists"
      });
    }

    const userDetails = await Admin.create(req.body);
    
    res.status(201).json({
      success: true,
      msg: "Admin created successfully",
      userDetails: {
        id: userDetails._id,
        userName: userDetails.userName,
        email: userDetails.email
      }
    });
  } catch (err) {
    console.error("Admin Signup Error:", err);
    res.status(400).json({
      success: false,
      msg: "Error during signup",
      error: err.message
    });
  }
};

const adminLogin = async (req, res) => {
  const { userName, email, password } = req.body;

  try {
    console.log("=== Admin Login Attempt ===");
    console.log("Request body:", { userName, email, hasPassword: !!password });

    // Validate input
    if ((!userName && !email) || !password) {
      console.log("Validation failed: Missing credentials");
      return res.status(400).json({
        success: false,
        msg: "Please provide username or email and password"
      });
    }

    // Find admin by username or email
    const query = {};
    if (userName) query.userName = userName;
    if (email) query.email = email;

    console.log("Searching for admin with query:", query);

    const existAdmin = await Admin.findOne({
      $or: [
        { userName: userName || null },
        { email: email || null }
      ].filter(item => Object.values(item)[0] !== null)
    });

    console.log("Admin found:", existAdmin ? {
      id: existAdmin._id,
      userName: existAdmin.userName,
      email: existAdmin.email
    } : "No admin found");

    if (!existAdmin) {
      return res.status(404).json({
        success: false,
        msg: "Admin not found. Please check your username or email."
      });
    }

    // Verify password
    console.log("Verifying password...");
    const isMatch = await existAdmin.matchPassword(password);
    console.log("Password match result:", isMatch);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        msg: "Incorrect password"
      });
    }

    // Generate token
    const token = generateToken(existAdmin._id);
    console.log("Token generated successfully");

    // Send response
    const response = {
      success: true,
      msg: "Admin login successful",
      adminToken: token,
      admin: {
        id: existAdmin._id,
        userName: existAdmin.userName,
        email: existAdmin.email
      }
    };

    console.log("Sending success response");
    console.log("=== Admin Login Successful ===");

    res.status(200).json(response);

  } catch (err) {
    console.error("=== Admin Login Error ===");
    console.error("Error details:", err);
    res.status(500).json({
      success: false,
      msg: "Internal Server Error",
      error: err.message
    });
  }
};

export { adminSignup, adminLogin };