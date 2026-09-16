const express = require('express');
const router = express.Router();
const {
  getVideoAnnotations,
  getCommentAnnotation,
  createAnnotation,
  deleteAnnotation,
} = require('../controllers/annotationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.delete('/:id', deleteAnnotation);
router.get('/comments/:commentId', getCommentAnnotation);

module.exports = router;
