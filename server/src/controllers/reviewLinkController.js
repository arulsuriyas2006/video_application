const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ReviewLink = require('../models/ReviewLink');
const Video = require('../models/Video');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const Annotation = require('../models/Annotation');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

const JWT_SECRET = process.env.JWT_SECRET || 'videoflow-secret-key-development-2024';

/**
 * @desc    Create a tokenized client review link for a video cut
 * @route   POST /api/videos/:videoId/review-links
 * @access  Private (Admin or Editor)
 */
const createReviewLink = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const {
      title,
      allowComments = true,
      allowDownload = false,
      requirePasscode = false,
      passcode,
      expiresInDays, // optional number of days (e.g. 1, 7, 30, or null)
    } = req.body;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video cut not found',
      });
    }

    let passcodeHash = null;
    if (requirePasscode && passcode) {
      const salt = await bcrypt.genSalt(10);
      passcodeHash = await bcrypt.hash(passcode.trim(), salt);
    }

    let expiresAt = null;
    if (expiresInDays && Number(expiresInDays) > 0) {
      expiresAt = new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000);
    }

    const token = crypto.randomBytes(20).toString('hex');

    const reviewLink = await ReviewLink.create({
      token,
      videoId: video._id,
      projectId: video.projectId,
      createdBy: req.user._id,
      title: title || `${video.title} — Client Review`,
      allowComments,
      allowDownload,
      requirePasscode: Boolean(requirePasscode && passcode),
      passcodeHash,
      expiresAt,
    });

    // Log Activity
    await Activity.create({
      projectId: video.projectId,
      userId: req.user._id,
      type: 'PROJECT_UPDATED',
      message: `${req.user.name} generated a client review link for "${video.title}"`,
      metadata: {
        videoId: video._id,
        reviewLinkId: reviewLink._id,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...reviewLink.toObject(),
        shareUrl: `/review/share/${reviewLink.token}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all review links created for a specific video cut
 * @route   GET /api/videos/:videoId/review-links
 * @access  Private
 */
const getVideoReviewLinks = async (req, res, next) => {
  try {
    const { videoId } = req.params;

    const links = await ReviewLink.find({ videoId })
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: links.length,
      data: links.map((l) => ({
        ...l.toObject(),
        shareUrl: `/review/share/${l.token}`,
        isExpired: l.expiresAt ? new Date() > l.expiresAt : false,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Revoke / deactivate a review link
 * @route   DELETE /api/review-links/:id
 * @access  Private (Admin, or Creator)
 */
const revokeReviewLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const link = await ReviewLink.findById(id);

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Review link not found',
      });
    }

    if (
      link.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to revoke this link',
      });
    }

    link.isActive = false;
    await link.save();

    res.status(200).json({
      success: true,
      message: 'Review link successfully revoked',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public client review session by token
 * @route   GET /api/public/review/:token
 * @access  Public
 */
const getPublicReviewSession = async (req, res, next) => {
  try {
    const { token } = req.params;
    const reviewLink = await ReviewLink.findOne({ token, isActive: true })
      .select('+passcodeHash');

    if (!reviewLink) {
      return res.status(404).json({
        success: false,
        message: 'Review link not found or has been revoked',
      });
    }

    // Check expiration
    if (reviewLink.expiresAt && new Date() > reviewLink.expiresAt) {
      return res.status(410).json({
        success: false,
        message: 'This review link has expired. Please request a new link from the production team.',
      });
    }

    // Check passcode authorization if required
    let isUnlocked = true;
    if (reviewLink.requirePasscode) {
      const authHeader = req.headers['x-review-passcode-token'];
      if (!authHeader) {
        isUnlocked = false;
      } else {
        try {
          const decoded = jwt.verify(authHeader, JWT_SECRET);
          if (decoded.token !== token) isUnlocked = false;
        } catch (e) {
          isUnlocked = false;
        }
      }
    }

    // Fetch minimal project info
    const project = await Project.findById(reviewLink.projectId).select('name clientId');

    if (!isUnlocked) {
      return res.status(200).json({
        success: true,
        data: {
          requiresPasscode: true,
          title: reviewLink.title,
          projectName: project ? project.name : 'Video Review',
        },
      });
    }

    // Increment view count
    reviewLink.viewsCount += 1;
    reviewLink.lastViewedAt = new Date();
    await reviewLink.save();

    // Fetch video, comments, annotations
    const video = await Video.findById(reviewLink.videoId).populate(
      'uploadedBy',
      'name avatar'
    );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video cut is no longer available',
      });
    }

    const [comments, annotations] = await Promise.all([
      Comment.find({ videoId: video._id, parentCommentId: null })
        .populate('userId', 'name role avatar')
        .populate('resolvedBy', 'name')
        .sort({ timestamp: 1 }),
      Annotation.find({ videoId: video._id }),
    ]);

    // Fetch replies for comments
    const commentIds = comments.map((c) => c._id);
    const replies = await Comment.find({ parentCommentId: { $in: commentIds } })
      .populate('userId', 'name role avatar')
      .sort({ createdAt: 1 });

    const replyMap = {};
    replies.forEach((r) => {
      const pId = r.parentCommentId.toString();
      if (!replyMap[pId]) replyMap[pId] = [];
      replyMap[pId].push(r);
    });

    const enrichedComments = comments.map((c) => ({
      ...c.toObject(),
      replies: replyMap[c._id.toString()] || [],
    }));

    res.status(200).json({
      success: true,
      data: {
        requiresPasscode: false,
        link: {
          _id: reviewLink._id,
          token: reviewLink.token,
          title: reviewLink.title,
          allowComments: reviewLink.allowComments,
          allowDownload: reviewLink.allowDownload,
          approvalStatus: reviewLink.approvalStatus,
          clientReviewerName: reviewLink.clientReviewerName,
          approvalNotes: reviewLink.approvalNotes,
          decidedAt: reviewLink.decidedAt,
        },
        project: {
          _id: project._id,
          name: project.name,
        },
        video,
        comments: enrichedComments,
        annotations,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify passcode for a protected public review link
 * @route   POST /api/public/review/:token/verify
 * @access  Public
 */
const verifyPasscode = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { passcode } = req.body;

    if (!passcode) {
      return res.status(400).json({
        success: false,
        message: 'Please enter the access passcode',
      });
    }

    const reviewLink = await ReviewLink.findOne({ token, isActive: true })
      .select('+passcodeHash');

    if (!reviewLink) {
      return res.status(404).json({
        success: false,
        message: 'Review link not found or inactive',
      });
    }

    const isMatch = await reviewLink.matchPasscode(passcode.trim());
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect access passcode',
      });
    }

    // Issue signed passcode session token (valid 48h)
    const sessionToken = jwt.sign(
      { linkId: reviewLink._id, token: reviewLink.token },
      JWT_SECRET,
      { expiresIn: '48h' }
    );

    res.status(200).json({
      success: true,
      message: 'Passcode verified successfully',
      passcodeToken: sessionToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create feedback comment from public reviewer
 * @route   POST /api/public/review/:token/comments
 * @access  Public
 */
const createPublicComment = async (req, res, next) => {
  try {
    const { token } = req.params;
    const {
      timestamp = 0,
      message,
      authorName = 'Client Reviewer',
      shapes = [],
    } = req.body;

    const reviewLink = await ReviewLink.findOne({ token, isActive: true });
    if (!reviewLink) {
      return res.status(404).json({
        success: false,
        message: 'Review link is invalid or expired',
      });
    }

    if (!reviewLink.allowComments) {
      return res.status(403).json({
        success: false,
        message: 'Feedback comments are disabled for this review link',
      });
    }

    if (!message && (!shapes || shapes.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Feedback comment cannot be empty',
      });
    }

    const comment = await Comment.create({
      videoId: reviewLink.videoId,
      projectId: reviewLink.projectId,
      userId: null,
      authorName: authorName.trim() || 'Client Reviewer',
      isGuest: true,
      timestamp: parseFloat(timestamp) || 0,
      message: message ? message.trim() : 'Guest annotation attached',
      hasAnnotation: shapes && shapes.length > 0,
    });

    let annotation = null;
    if (shapes && shapes.length > 0) {
      annotation = await Annotation.create({
        videoId: reviewLink.videoId,
        projectId: reviewLink.projectId,
        commentId: comment._id,
        userId: null,
        isGuest: true,
        timestamp: comment.timestamp,
        shapes,
      });

      comment.annotationId = annotation._id;
      await comment.save();
    }

    const payload = {
      ...comment.toObject(),
      annotationId: annotation,
      replies: [],
    };

    // Broadcast real-time socket event to all collaborators
    const io = req.app.get('io');
    if (io) {
      const emitData = {
        projectId: reviewLink.projectId,
        videoId: reviewLink.videoId,
        comment: payload,
      };
      io.to(`project:${reviewLink.projectId}`).emit('new_comment', emitData);
      io.to(`video:${reviewLink.videoId}`).emit('new_comment', emitData);
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
 * @desc    Submit client sign-off decision (Approve or Request Changes)
 * @route   POST /api/public/review/:token/decision
 * @access  Public
 */
const submitApprovalDecision = async (req, res, next) => {
  try {
    const { token } = req.params;
    const {
      decision, // 'APPROVE' or 'REQUEST_CHANGES'
      reviewerName = 'Client',
      reviewerEmail,
      notes = '',
    } = req.body;

    if (!['APPROVE', 'REQUEST_CHANGES'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approval decision. Must be APPROVE or REQUEST_CHANGES',
      });
    }

    const reviewLink = await ReviewLink.findOne({ token, isActive: true });
    if (!reviewLink) {
      return res.status(404).json({
        success: false,
        message: 'Review link is not found or has been revoked',
      });
    }

    const video = await Video.findById(reviewLink.videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    const isApproved = decision === 'APPROVE';
    const newStatus = isApproved ? 'APPROVED' : 'CHANGES_REQUESTED';

    // Update ReviewLink
    reviewLink.approvalStatus = newStatus;
    reviewLink.clientReviewerName = reviewerName.trim();
    reviewLink.clientReviewerEmail = reviewerEmail ? reviewerEmail.trim() : null;
    reviewLink.approvalNotes = notes.trim();
    reviewLink.decidedAt = new Date();
    await reviewLink.save();

    // Update Video status
    video.status = newStatus;
    await video.save();

    // Log Project Activity
    await Activity.create({
      projectId: video.projectId,
      userId: reviewLink.createdBy || null,
      type: isApproved ? 'VIDEO_APPROVED' : 'CHANGES_REQUESTED',
      message: isApproved
        ? `🎉 ${reviewerName} (Client) APPROVED "${video.title}"!`
        : `⚠️ ${reviewerName} (Client) requested revisions on "${video.title}": "${notes.substring(0, 80)}"`,
      metadata: {
        videoId: video._id,
        decision: newStatus,
        reviewerName,
        notes,
      },
    });

    // Notify Video Uploader
    if (video.uploadedBy) {
      await Notification.create({
        userId: video.uploadedBy,
        projectId: video.projectId,
        videoId: video._id,
        type: 'STATUS_UPDATE',
        message: isApproved
          ? `Cut Approved! ${reviewerName} approved "${video.title}"`
          : `Changes Requested: ${reviewerName} requested changes on "${video.title}"`,
      });
    }

    // Broadcast real-time decision to Socket.IO rooms
    const io = req.app.get('io');
    if (io) {
      const eventData = {
        videoId: video._id,
        projectId: video.projectId,
        status: newStatus,
        reviewerName,
        notes,
        decidedAt: reviewLink.decidedAt,
      };
      io.to(`project:${video.projectId}`).emit('video_status_changed', eventData);
      io.to(`video:${video._id}`).emit('video_status_changed', eventData);
      io.to(`video:${video._id}`).emit('approval_decision', eventData);
    }

    res.status(200).json({
      success: true,
      message: isApproved
        ? 'Cut successfully approved! The production team has been notified.'
        : 'Changes requested. The editing team has received your notes.',
      data: {
        approvalStatus: reviewLink.approvalStatus,
        clientReviewerName: reviewLink.clientReviewerName,
        decidedAt: reviewLink.decidedAt,
        videoStatus: video.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReviewLink,
  getVideoReviewLinks,
  revokeReviewLink,
  getPublicReviewSession,
  verifyPasscode,
  createPublicComment,
  submitApprovalDecision,
};
