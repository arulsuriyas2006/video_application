const express = require('express');
const router = express.Router();
const {
  replyToComment,
  toggleResolveComment,
  deleteComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/:commentId/replies', replyToComment);
router.patch('/:commentId/resolve', toggleResolveComment);
router.delete('/:commentId', deleteComment);

module.exports = router;
