const express = require('express');
const router = express.Router();
const {
  replyToComment,
  toggleResolveComment,
  deleteComment,
  uploadVoiceNote,
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const { uploadAudio } = require('../middleware/uploadMiddleware');

router.use(protect);

router.post('/upload-audio', uploadAudio.single('audio'), uploadVoiceNote);
router.post('/:commentId/replies', replyToComment);
router.patch('/:commentId/resolve', toggleResolveComment);
router.delete('/:commentId', deleteComment);

module.exports = router;
