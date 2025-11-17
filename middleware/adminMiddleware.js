import AsyncHandler from 'express-async-handler'
import Admin from '../models/adminSchema.js'
import jwt from 'jsonwebtoken'

const adminProtect = AsyncHandler(async (req, res, next) => {
  try {
    // ✅ CHECK BOTH HEADERS
    let token = req.headers.authorization || req.headers.token;

    // ✅ HANDLE "Bearer TOKEN" FORMAT
    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7); // Remove "Bearer " prefix
    }

    // ✅ VALIDATE TOKEN EXISTS
    if (!token) {
      return res.status(401).json({ 
        success: false,
        msg: 'No token provided. Authorization required.' 
      });
    }

    // ✅ VERIFY JWT TOKEN
    let decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // ✅ CHECK IF USER IS ADMIN
    let isAdmin = await Admin.findOne({ _id: decoded.id });
    
    if (!isAdmin) {
      return res.status(403).json({ 
        success: false,
        msg: 'Unauthorized. Admin access required.' 
      });
    }

    // ✅ ATTACH ADMIN TO REQUEST
    req.admin = isAdmin;
    req.adminId = isAdmin._id;
    
    next();

  } catch (error) {
    console.error('❌ Auth Error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        msg: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        msg: 'Token expired' 
      });
    }

    res.status(401).json({ 
      success: false,
      msg: 'Not authorized' 
    });
  }
});

export default adminProtect;