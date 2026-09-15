const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  testRoleAccess,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);

// Role testing routes to verify RBAC
router.get('/test/admin', protect, authorize('ADMIN'), testRoleAccess);
router.get('/test/editor', protect, authorize('ADMIN', 'EDITOR'), testRoleAccess);
router.get('/test/client', protect, authorize('ADMIN', 'EDITOR', 'CLIENT'), testRoleAccess);

module.exports = router;
