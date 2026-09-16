const Annotation = require('../models/Annotation');
const Comment = require('../models/Comment');
const Video = require('../models/Video');
const Activity = require('../models/Activity');

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
};

/**
 * @desc    Get all annotations for a video
 * @route   GET /api/videos/:videoId/annotations
 * @access  Private
 */
const getVideoAnnotations = async (req, res, next) => {
  try {
    const { videoId } = req.params;

    const annotations = await Annotation.find({ videoId })
      .populate('userId', 'name email avatar role')
      .populate('commentId', 'message timestamp status')
      .sort({ timestamp: 1 });

    res.status(200).json({
      success: true,
      count: annotations.length,
      data: annotations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get annotation by comment ID
 * @route   GET /api/comments/:commentId/annotations
 * @access  Private
 */
const getCommentAnnotation = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const annotation = await Annotation.findOne({ commentId })
      .populate('userId', 'name email avatar role');

    if (!annotation) {
      return res.status(404).json({
        success: false,
        message: 'No annotation found for this comment',
      });
    }

    res.status(200).json({
      success: true,
      data: annotation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create visual annotation on video
 * @route   POST /api/videos/:videoId/annotations
 * @access  Private
 */
const createAnnotation = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { timestamp, shapes, commentId } = req.body;

    if (timestamp === undefined || !shapes || !Array.isArray(shapes) || shapes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Timestamp and at least one drawing shape are required',
      });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    const annotation = await Annotation.create({
      videoId: video._id,
      projectId: video.projectId,
      commentId: commentId || null,
      userId: req.user._id,
      timestamp: Math.max(0, parseFloat(timestamp)),
      shapes,
    });

    if (commentId) {
      await Comment.findByIdAndUpdate(commentId, {
        hasAnnotation: true,
        annotationId: annotation._id,
      });
    }

    const timeStr = formatTime(annotation.timestamp);
    await Activity.create({
      projectId: video.projectId,
      userId: req.user._id,
      type: 'COMMENT_CREATED',
      message: `${req.user.name} added visual drawing feedback on "${video.title}" at ${timeStr} (${shapes.length} shape${shapes.length > 1 ? 's' : ''})`,
      metadata: {
        videoId: video._id,
        annotationId: annotation._id,
        timestamp: annotation.timestamp,
      },
    });

    const populated = await Annotation.findById(annotation._id)
      .populate('userId', 'name email avatar role');

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${video.projectId}`).emit('new_annotation', {
        projectId: video.projectId,
        videoId: video._id,
        annotation: populated,
      });
    }

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an annotation
 * @route   DELETE /api/annotations/:id
 * @access  Private
 */
const deleteAnnotation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const annotation = await Annotation.findById(id);

    if (!annotation) {
      return res.status(404).json({
        success: false,
        message: 'Annotation not found',
      });
    }

    if (
      annotation.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this annotation',
      });
    }

    if (annotation.commentId) {
      await Comment.findByIdAndUpdate(annotation.commentId, {
        hasAnnotation: false,
        annotationId: null,
      });
    }

    await annotation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Annotation deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVideoAnnotations,
  getCommentAnnotation,
  createAnnotation,
  deleteAnnotation,
};
