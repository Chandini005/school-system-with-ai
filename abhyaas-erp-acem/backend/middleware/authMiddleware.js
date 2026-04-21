// const jwt = require('jsonwebtoken');
// const JWT_SECRET = process.env.JWT_SECRET || 'abhyaas_erp_secret_2024';

// module.exports = (req, res, next) => {
//   const header = req.headers.authorization;
//   if (!header || !header.startsWith('Bearer '))
//     return res.status(401).json({ success:false, message:'No token provided' });

//   const token = header.split(' ')[1];
//   try {
//     req.user = jwt.verify(token, JWT_SECRET);
//     next();
//   } catch(e) {
//     res.status(401).json({ success:false, message:'Invalid or expired token' });
//   }
// };
import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    // Check if header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    
    // Use the same secret key from your .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_fallback_secret_key');
    
    req.user = decoded;
    next();
  } catch (e) {
    console.error("Auth Error:", e.message);
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export default auth;