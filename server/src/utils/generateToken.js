const jwt = require('jsonwebtoken');

/**
 * Generate JWT and optionally set as HTTP-only cookie
 * @param {Object} res - Express response object
 * @param {string} userId - Mongo user ID
 * @returns {string} token
 */
const generateTokenAndSetCookie = (res, userId) => {
  const secret = process.env.JWT_SECRET || 'videoflow_super_secret_jwt_key_2026_dev';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  const token = jwt.sign({ id: userId }, secret, {
    expiresIn,
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res.cookie('token', token, cookieOptions);

  return token;
};

module.exports = { generateTokenAndSetCookie };
