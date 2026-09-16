const express = require('express');
const router = express.Router();
const {
  createReviewLink,
  getVideoReviewLinks,
  revokeReviewLink,
  getPublicReviewSession,
  verifyPasscode,
  createPublicComment,
  submitApprovalDecision,
} = require('../controllers/reviewLinkController');
const { protect } = require('../middleware/authMiddleware');

// Public Client Review Endpoints (No login required)
router.get('/public/:token', getPublicReviewSession);
router.post('/public/:token/verify', verifyPasscode);
router.post('/public/:token/comments', createPublicComment);
router.post('/public/:token/decision', submitApprovalDecision);

// Private Management Endpoints (Requires Login)
router.post('/videos/:videoId', protect, createReviewLink);
router.get('/videos/:videoId', protect, getVideoReviewLinks);
router.delete('/:id', protect, revokeReviewLink);

module.exports = router;
