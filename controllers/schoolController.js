import School from '../models/School.js';

// @desc    Get all schools
// @route   GET /api/schools
// @access  Public
export const getSchools = async (req, res) => {
    try {
        const schools = await School.find({}).select('-__v -createdAt -updatedAt');
        res.status(200).json({
            success: true,
            count: schools.length,
            data: schools
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to fetch schools',
            error: error.message
        });
    }
};
