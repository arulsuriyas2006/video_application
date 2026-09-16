const express = require('express');
const router = express.Router();
const {
  uploadVideoFile,
  getVideoById,
  getProjectVersions,
  updateVideoStatus,
  deleteVideo,
} = require('../controllers/videoController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadVideo, uploadAudio } = require('../middleware/uploadMiddleware');

router.use(protect);

// Video Upload: Admin & Editor
router.post(
  '/upload',
  authorize('ADMIN', 'EDITOR'),
  uploadVideo.single('video'),
  uploadVideoFile
);

router
  .route('/:id')
  .get(getVideoById)
  .delete(authorize('ADMIN'), deleteVideo);

router.patch('/:id/status', authorize('ADMIN', 'EDITOR'), updateVideoStatus);

const {
  getVideoComments,
  createVideoComment,
} = require('../controllers/commentController');

const {
  getVideoAnnotations,
  createAnnotation,
} = require('../controllers/annotationController');

// Versions listing
router.get('/project/:projectId', getProjectVersions);

// Video Comments (supports text, annotations, and voice notes)
router
  .route('/:videoId/comments')
  .get(getVideoComments)
  .post(uploadAudio.single('audio'), createVideoComment);

// Video Annotations
router
  .route('/:videoId/annotations')
  .get(getVideoAnnotations)
  .post(createAnnotation);

module.exports = router;
