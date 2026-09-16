const path = require('path');
const fs = require('fs');
const Comment = require('../models/Comment');
const Annotation = require('../models/Annotation');
const Video = require('../models/Video');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
};

/**
 * @desc    Get comments for a video (sorted by timestamp for timeline markers)
 * @route   GET /api/videos/:videoId/comments
 * @access  Private
 */
const getVideoComments = async (req, res, next) => {
  try {
    const { videoId } = req.params;

    // Fetch top-level comments
    const comments = await Comment.find({
      videoId,
      parentCommentId: null,
    })
      .populate('userId', 'name email avatar role')
      .populate('resolvedBy', 'name email avatar role')
      .populate('annotationId')
      .sort({ timestamp: 1, createdAt: 1 });

    // Fetch replies for these comments
    const commentIds = comments.map((c) => c._id);
    const replies = await Comment.find({
      parentCommentId: { $in: commentIds },
    })
      .populate('userId', 'name email avatar role')
      .sort({ createdAt: 1 });

    const replyMap = {};
    replies.forEach((r) => {
      const parentId = r.parentCommentId.toString();
      if (!replyMap[parentId]) replyMap[parentId] = [];
      replyMap[parentId].push(r);
    });

    const enrichedComments = comments.map((c) => ({
      ...c.toObject(),
      replies: replyMap[c._id.toString()] || [],
    }));

    res.status(200).json({
      success: true,
      count: enrichedComments.length,
      data: enrichedComments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all feedback across all video cuts for a project
 * @route   GET /api/projects/:projectId/comments
 * @access  Private
 */
const getProjectComments = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;

    const filter = { projectId, parentCommentId: null };
    if (status) filter.status = status;

    const comments = await Comment.find(filter)
      .populate('userId', 'name email avatar role')
      .populate('videoId', 'title versionNumber')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new timestamped comment
 * @route   POST /api/videos/:videoId/comments
 * @access  Private
 */
const createVideoComment = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    let { timestamp, message, shapes, voiceNoteDuration } = req.body;

    if (typeof shapes === 'string') {
      try {
        shapes = JSON.parse(shapes);
      } catch (e) {
        shapes = [];
      }
    }

    const hasAudio = !!req.file;
    const finalMessage = message?.trim() || (hasAudio ? '🎙️ Voice note attached' : '');

    if (
      timestamp === undefined ||
      (!finalMessage && !hasAudio && (!shapes || shapes.length === 0))
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Timestamp and feedback message, voice note, or visual markup are required',
      });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    const parsedTimestamp = Math.max(0, parseFloat(timestamp));
    const parsedDuration = parseFloat(voiceNoteDuration || 0);

    const comment = await Comment.create({
      videoId: video._id,
      projectId: video.projectId,
      userId: req.user._id,
      timestamp: Math.round(parsedTimestamp * 100) / 100,
      message: finalMessage,
      status: 'OPEN',
      hasVoiceNote: hasAudio,
      voiceNoteUrl: hasAudio ? `/uploads/audio/${req.file.filename}` : null,
      voiceNoteDuration: parsedDuration,
    });

    let annotation = null;
    if (shapes && Array.isArray(shapes) && shapes.length > 0) {
      annotation = await Annotation.create({
        videoId: video._id,
        projectId: video.projectId,
        commentId: comment._id,
        userId: req.user._id,
        timestamp: Math.round(parsedTimestamp * 100) / 100,
        shapes,
      });
      comment.hasAnnotation = true;
      comment.annotationId = annotation._id;
      await comment.save();
    }

    // Create activity log
    const timeStr = formatTime(parsedTimestamp);
    await Activity.create({
      projectId: video.projectId,
      userId: req.user._id,
      type: 'COMMENT_CREATED',
      message: `${req.user.name} added feedback on "${video.title}" at ${timeStr}: "${message.substring(0, 60)}"`,
      metadata: {
        videoId: video._id,
        commentId: comment._id,
        timestamp: parsedTimestamp,
      },
    });

    // Notify assigned editor or project creator
    const project = await Project.findById(video.projectId);
    if (
      project?.assignedEditorId &&
      project.assignedEditorId.toString() !== req.user._id.toString()
    ) {
      await Notification.create({
        userId: project.assignedEditorId,
        projectId: project._id,
        videoId: video._id,
        type: 'NEW_COMMENT',
        message: `${req.user.name} commented on "${video.title}" at ${timeStr}`,
      });
    }

    const populated = await Comment.findById(comment._id)
      .populate('userId', 'name email avatar role')
      .populate('resolvedBy', 'name email avatar role')
      .populate('annotationId');

    const payload = {
      ...populated.toObject(),
      replies: [],
    };

    const io = req.app.get('io');
    if (io) {
      const emitData = {
        projectId: video.projectId,
        videoId: video._id,
        comment: payload,
      };
      io.to(`project:${video.projectId}`).emit('new_comment', emitData);
      io.to(`video:${video._id}`).emit('new_comment', emitData);
    }

    res.status(201).json({
      success: true,
      data: payload,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reply to an existing comment
 * @route   POST /api/comments/:commentId/replies
 * @access  Private
 */
const replyToComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Reply message cannot be empty',
      });
    }

    const parent = await Comment.findById(commentId).populate('userId', 'name');
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent comment not found',
      });
    }

    const reply = await Comment.create({
      videoId: parent.videoId,
      projectId: parent.projectId,
      userId: req.user._id,
      timestamp: parent.timestamp,
      message,
      status: 'OPEN',
      parentCommentId: parent._id,
    });

    const timeStr = formatTime(parent.timestamp);

    // Log Activity
    await Activity.create({
      projectId: parent.projectId,
      userId: req.user._id,
      type: 'REPLY_ADDED',
      message: `${req.user.name} replied to feedback at ${timeStr}: "${message.substring(0, 60)}"`,
      metadata: {
        parentCommentId: parent._id,
        replyId: reply._id,
        timestamp: parent.timestamp,
      },
    });

    // Notify author of parent comment if different
    if (parent.userId && parent.userId._id.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: parent.userId._id,
        projectId: parent.projectId,
        videoId: parent.videoId,
        type: 'COMMENT_REPLY',
        message: `${req.user.name} replied to your feedback at ${timeStr}`,
      });
    }

    const populatedReply = await Comment.findById(reply._id).populate(
      'userId',
      'name email avatar role'
    );

    const io = req.app.get('io');
    if (io) {
      const replyData = {
        parentCommentId: parent._id,
        videoId: parent.videoId,
        reply: populatedReply,
      };
      io.to(`project:${parent.projectId}`).emit('new_reply', replyData);
      io.to(`video:${parent.videoId}`).emit('new_reply', replyData);
    }

    res.status(201).json({
      success: true,
      data: populatedReply,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle comment resolved/reopened status
 * @route   PATCH /api/comments/:commentId/resolve
 * @access  Private
 */
const toggleResolveComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId)
      .populate('userId', 'name')
      .populate('videoId', 'title');

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    const isResolving = comment.status === 'OPEN';
    comment.status = isResolving ? 'RESOLVED' : 'OPEN';
    comment.resolvedBy = isResolving ? req.user._id : null;
    comment.resolvedAt = isResolving ? new Date() : null;

    await comment.save();

    const timeStr = formatTime(comment.timestamp);

    // Activity Log
    await Activity.create({
      projectId: comment.projectId,
      userId: req.user._id,
      type: 'COMMENT_RESOLVED',
      message: isResolving
        ? `${req.user.name} resolved feedback at ${timeStr}: "${comment.message.substring(0, 50)}"`
        : `${req.user.name} reopened feedback at ${timeStr}: "${comment.message.substring(0, 50)}"`,
      metadata: {
        commentId: comment._id,
        status: comment.status,
        timestamp: comment.timestamp,
      },
    });

    // Notify comment author if resolver is someone else
    if (comment.userId && comment.userId._id.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: comment.userId._id,
        projectId: comment.projectId,
        videoId: comment.videoId?._id || null,
        type: 'STATUS_UPDATE',
        message: `${req.user.name} marked your comment at ${timeStr} as ${comment.status}`,
      });
    }

    const populated = await Comment.findById(comment._id)
      .populate('userId', 'name email avatar role')
      .populate('resolvedBy', 'name email avatar role');

    const io = req.app.get('io');
    if (io) {
      const vidId = comment.videoId?._id || comment.videoId;
      const resolveData = {
        commentId: comment._id,
        videoId: vidId,
        status: comment.status,
        resolvedBy: populated.resolvedBy,
        resolvedAt: populated.resolvedAt,
      };
      io.to(`project:${comment.projectId}`).emit('comment_resolved', resolveData);
      io.to(`video:${vidId}`).emit('comment_resolved', resolveData);
    }

    res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a comment and its threaded replies
 * @route   DELETE /api/comments/:commentId
 * @access  Private (Author or Admin)
 */
const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Permission: author or admin
    if (
      comment.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment',
      });
    }

    const timeStr = formatTime(comment.timestamp);

    // Delete voice note audio file if present
    if (comment.voiceNoteUrl) {
      const audioPath = path.join(__dirname, '../../', comment.voiceNoteUrl);
      if (fs.existsSync(audioPath)) {
        try {
          fs.unlinkSync(audioPath);
        } catch (e) {
          console.error('Failed to unlink audio note:', e);
        }
      }
    }

    // Delete comment and its replies, and any linked annotations
    await Promise.all([
      Comment.deleteMany({
        $or: [{ _id: comment._id }, { parentCommentId: comment._id }],
      }),
      Annotation.deleteMany({
        $or: [
          { commentId: comment._id },
          { videoId: comment.videoId, timestamp: comment.timestamp },
        ],
      }),
    ]);

    // Log Activity
    await Activity.create({
      projectId: comment.projectId,
      userId: req.user._id,
      type: 'COMMENT_CREATED',
      message: `${req.user.name} removed feedback at ${timeStr}`,
    });

    const io = req.app.get('io');
    if (io) {
      const deleteData = {
        commentId: comment._id,
        videoId: comment.videoId,
        projectId: comment.projectId,
        timestamp: comment.timestamp,
      };
      io.to(`project:${comment.projectId}`).emit('comment_deleted', deleteData);
      io.to(`video:${comment.videoId}`).emit('comment_deleted', deleteData);
    }

    res.status(200).json({
      success: true,
      message: 'Comment removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload standalone voice note
 * @route   POST /api/comments/upload-audio
 * @access  Private
 */
const uploadVoiceNote = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Audio file is required' });
    }
    res.status(200).json({
      success: true,
      data: {
        voiceNoteUrl: `/uploads/audio/${req.file.filename}`,
        filename: req.file.filename,
        size: req.file.size,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVideoComments,
  getProjectComments,
  createVideoComment,
  replyToComment,
  toggleResolveComment,
  deleteComment,
  uploadVoiceNote,
};
