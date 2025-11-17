import AsyncHandler from 'express-async-handler';
import User from '../models/userSchema.js';
import jwt from 'jsonwebtoken';

const protect = AsyncHandler(async (req, res, next) => {
  try {
    let token;

    // ✅ Check for token in multiple places
    // 1. Check Authorization header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // 2. Check token header directly
    else if (req.headers.token) {
      token = req.headers.token;
    }

    // ✅ If no token found
    if (!token) {
      console.warn('⚠️ No token provided');
      res.status(401).json({ 
        success: false,
        msg: 'Not authorized - No token provided' 
      });
      throw new Error('Not Authorized - No Token');
    }

    console.log('🔑 Token received, verifying...');

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log('✅ Token verified for user ID:', decoded.id);

    // ✅ Find user
    const isUser = await User.findOne({ _id: decoded.id }).select('-password');
    
    if (!isUser) {
      console.error('❌ User not found for ID:', decoded.id);
      res.status(401).json({ 
        success: false,
        msg: 'User not found' 
      });
      throw new Error('Not Authorized - User Not Found');
    }

    // ✅ Check if user is a student (optional - remove if you want all users)
    if (isUser.role !== 'student' && isUser.role !== 'user') {
      console.error('❌ User is not a student. Role:', isUser.role);
      res.status(403).json({ 
        success: false,
        msg: 'Access denied. Student access required.',
        userRole: isUser.role
      });
      throw new Error('Forbidden - Not a Student');
    }

    console.log('✅ User authenticated:', isUser.fullName, '| Role:', isUser.role);

    // ✅ Attach user to request
    req.user = isUser;
    next();

  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);

    // ✅ Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ 
        success: false,
        msg: 'Invalid token' 
      });
    } else if (error.name === 'TokenExpiredError') {
      res.status(401).json({ 
        success: false,
        msg: 'Token expired. Please login again.' 
      });
    } else if (!res.headersSent) {
      // Only send response if not already sent
      res.status(401).json({ 
        success: false,
        msg: 'Not authorized - Token verification failed' 
      });
    }
    
    throw new Error('Not authorized, token failed');
  }
});

export default protect;