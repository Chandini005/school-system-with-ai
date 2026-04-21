import { AcademicYear } from '../models/index.js';

/**
 * Academic Year Interceptor Middleware
 * 
 * 1. Checks for X-Academic-Year header in the incoming request.
 * 2. If present, attaches it to req.academicYear.
 * 3. If missing, queries the database for the globally active academic year.
 * 4. Ensures all subsequent controllers have access to the current timeline context.
 */
let cachedActiveYear = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Academic Year Interceptor Middleware
 * 
 * Performance Optimized: Uses in-memory caching to avoid redundant DB queries.
 * Stability Optimized: Uses a fail-soft hardcoded default if MongoDB is slow/unreachable.
 */
const academicYearInterceptor = async (req, res, next) => {
  try {
    let selectedYear = req.headers['x-academic-year'];

    if (!selectedYear) {
      const now = Date.now();
      
      // 1. Check Cache first
      if (cachedActiveYear && (now - lastCacheUpdate < CACHE_TTL)) {
        selectedYear = cachedActiveYear;
      } else {
        // 2. Query DB with a short internal timeout to avoid buffering delays
        try {
          const activeYearDoc = await AcademicYear.findOne({ isActive: true }).maxTimeMS(2000);
          
          if (activeYearDoc) {
            selectedYear = activeYearDoc.name;
            cachedActiveYear = selectedYear;
            lastCacheUpdate = now;
          } else {
            selectedYear = '2025-2026'; // Default Fallback
          }
        } catch (dbError) {
          // 3. Fail-soft: If DB is unreachable/timing out, use cache OR default immediately
          console.warn('⚠️ AcademicYear DB Query Failed. Using Fail-soft fallback.');
          selectedYear = cachedActiveYear || '2025-2026';
        }
      }
    }

    req.academicYear = selectedYear;
    next();
  } catch (error) {
    console.error('Academic Year Interceptor Critical Error:', error);
    req.academicYear = '2025-2026'; // Ultimate safety net
    next();
  }
};

export default academicYearInterceptor;
