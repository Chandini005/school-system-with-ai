// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';

// export const protect = async (req, res, next) => {
//     let token;

//     if (
//         req.headers.authorization &&
//         req.headers.authorization.startsWith('Bearer')
//     ) {
//         token = req.headers.authorization.split(' ')[1];
//     }

//     if (!token) {
//         return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
//     }

//     try {
//         const jwtSecret = process.env.JWT_SECRET || 'supersecretkey'; // Use env var in production
//         const decoded = jwt.verify(token, jwtSecret);

//         req.user = await User.findById(decoded.id);

//         if (!req.user) {
//             return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists' });
//         }

//         next();
//     } catch (error) {
//         return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
//     }
// };

// // Grant access to specific roles
// export const authorize = (...roles) => {
//     return (req, res, next) => {
//         if (!roles.includes(req.user.role)) {
//             return res.status(403).json({
//                 success: false,
//                 message: `User role ${req.user.role} is not authorized to access this route`
//             });
//         }
//         next();
//     };
// };
// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'abhyaas_erp_secret_2024';

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ success:false, message:'No token provided' });

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch(e) {
    res.status(401).json({ success:false, message:'Invalid or expired token' });
  }
};
// backend/middleware/authMiddleware.js

// ... existing auth middleware ...

export const principalOnly = (req, res, next) => {
  // Allow both Principal and Admin to view the Principal Dashboard
  if (req.user && (req.user.role === 'Principal' || req.user.role === 'Admin')) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied. Principal or Admin only.' });
  }
};