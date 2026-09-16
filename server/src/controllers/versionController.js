const Video = require('../models/Video');
const Project = require('../models/Project');
const Comment = require('../models/Comment');

/**
 * @desc    Compare two video versions within a project
 * @route   GET /api/projects/:projectId/compare?v1=:v1Id&v2=:v2Id
 * @access  Private
 */
const compareVersions = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { v1: v1Id, v2: v2Id } = req.query;

    if (!v1Id || !v2Id) {
      return res.status(400).json({
        success: false,
        message: 'Both v1 and v2 version IDs are required for comparison',
      });
    }

    const project = await Project.findById(projectId).populate('clientId', 'name company');
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const [v1, v2] = await Promise.all([
      Video.findById(v1Id).populate('uploadedBy', 'name email avatar role'),
      Video.findById(v2Id).populate('uploadedBy', 'name email avatar role'),
    ]);

    if (!v1 || !v2) {
      return res.status(404).json({
        success: false,
        message: 'One or both video versions could not be found',
      });
    }

    // Fetch comments for both cuts
    const [v1Comments, v2Comments] = await Promise.all([
      Comment.find({ videoId: v1._id, parentCommentId: null })
        .populate('userId', 'name role')
        .populate('resolvedBy', 'name')
        .sort({ timestamp: 1 }),
      Comment.find({ videoId: v2._id, parentCommentId: null })
        .populate('userId', 'name role')
        .populate('resolvedBy', 'name')
        .sort({ timestamp: 1 }),
    ]);

    // Calculate diff metrics
    const durationDelta = (v2.duration || 0) - (v1.duration || 0);
    const fileSizeDelta = (v2.fileSize || 0) - (v1.fileSize || 0);
    const v1ResolvedCount = v1Comments.filter((c) => c.status === 'RESOLVED').length;
    const v2ResolvedCount = v2Comments.filter((c) => c.status === 'RESOLVED').length;

    res.status(200).json({
      success: true,
      data: {
        project: {
          _id: project._id,
          name: project.name,
          client: project.clientId,
        },
        v1: {
          ...v1.toObject(),
          commentsCount: v1Comments.length,
          resolvedCount: v1ResolvedCount,
        },
        v2: {
          ...v2.toObject(),
          commentsCount: v2Comments.length,
          resolvedCount: v2ResolvedCount,
        },
        v1Comments,
        v2Comments,
        diffStats: {
          durationDeltaSeconds: Math.round(durationDelta * 100) / 100,
          fileSizeDeltaBytes: fileSizeDelta,
          resolutionChanged: v1.width !== v2.width || v1.height !== v2.height,
          v1TotalComments: v1Comments.length,
          v1ResolvedComments: v1ResolvedCount,
          v2TotalComments: v2Comments.length,
          v2ResolvedComments: v2ResolvedCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  compareVersions,
};
