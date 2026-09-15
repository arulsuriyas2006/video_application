const User = require('../models/User');

/**
 * @desc    Get users (supports role filtering)
 * @route   GET /api/users
 * @access  Private (Admin & Editor)
 */
const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    let filter = { isActive: true };
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-password')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers };
