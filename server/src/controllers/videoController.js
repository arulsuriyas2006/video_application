const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { processVideo } = require('../services/videoProcessor');

/**
 * @desc    Upload video and process metadata + thumbnail via FFmpeg
 * @route   POST /api/videos/upload
 * @access  Private (Admin or assigned Editor)
 */
const uploadVideoFile = async (req, res, next) => {
  try {
    const { projectId, title, status } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a video file',
      });
    }

    if (!projectId) {
      // Clean up uploaded file if missing project
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Project ID is required to associate this video',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Associated project not found',
      });
    }

    // Check authorization: Admin or assigned Editor
    if (req.user.role === 'EDITOR') {
      if (
        !project.assignedEditorId ||
        project.assignedEditorId.toString() !== req.user._id.toString()
      ) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(403).json({
          success: false,
          message: 'You are not assigned as editor for this project',
        });
      }
    } else if (req.user.role === 'CLIENT') {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'Client accounts cannot upload video revisions directly',
      });
    }

    // Determine Version Number (V1, V2, V3...)
    const latestVideo = await Video.findOne({ projectId })
      .sort({ versionNumber: -1 })
      .select('versionNumber');

    const nextVersion = latestVideo ? latestVideo.versionNumber + 1 : 1;

    // Process Video: Extract metadata (duration, width, height) and generate thumbnail
    const processed = await processVideo(req.file.path, req.file.originalname);

    const relativeFilePath = `/uploads/videos/${req.file.filename}`;

    const videoTitle =
      title ||
      path.parse(req.file.originalname).name ||
      `Version ${nextVersion}`;

    // Create Video in MongoDB
    const video = await Video.create({
      projectId: project._id,
      versionNumber: nextVersion,
      title: videoTitle,
      originalFileName: req.file.originalname,
      filePath: relativeFilePath,
      thumbnailPath: processed.thumbnailPath,
      duration: processed.duration,
      width: processed.width,
      height: processed.height,
      fileSize: processed.fileSize || req.file.size,
      uploadedBy: req.user._id,
      status: status || 'IN_REVIEW',
    });

    // Update Project status to IN_REVIEW if it was in DRAFT or CHANGES_REQUESTED
    if (['DRAFT', 'CHANGES_REQUESTED'].includes(project.status)) {
      project.status = 'IN_REVIEW';
      await project.save();
    }

    // Log Activity
    await Activity.create({
      projectId: project._id,
      userId: req.user._id,
      type: nextVersion === 1 ? 'VIDEO_UPLOADED' : 'NEW_VERSION_UPLOADED',
      message: `${req.user.name} uploaded Video V${nextVersion}: "${video.title}"`,
      metadata: {
        videoId: video._id,
        versionNumber: nextVersion,
        duration: video.duration,
        resolution: `${video.width}x${video.height}`,
      },
    });

    // Notify project room via Socket.io if available
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${projectId}`).emit('new_video_version', {
        projectId,
        version: video,
        versionNumber: nextVersion,
      });
    }

    const populatedVideo = await Video.findById(video._id).populate(
      'uploadedBy',
      'name email avatar role'
    );

    res.status(201).json({
      success: true,
      data: populatedVideo,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
    }
    next(error);
  }
};

/**
 * @desc    Get single video by ID
 * @route   GET /api/videos/:id
 * @access  Private
 */
const getVideoById = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('projectId', 'name clientId assignedEditorId status priority')
      .populate('uploadedBy', 'name email avatar role');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    res.status(200).json({
      success: true,
      data: video,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all versions for a project
 * @route   GET /api/projects/:projectId/versions
 * @access  Private
 */
const getProjectVersions = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const versions = await Video.find({ projectId })
      .populate('uploadedBy', 'name email avatar role')
      .sort({ versionNumber: -1 });

    res.status(200).json({
      success: true,
      count: versions.length,
      data: versions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update video status
 * @route   PATCH /api/videos/:id/status
 * @access  Private
 */
const updateVideoStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    video.status = status;
    await video.save();

    res.status(200).json({
      success: true,
      data: video,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete video and clean up disk files
 * @route   DELETE /api/videos/:id
 * @access  Private (Admin only)
 */
const deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    // Delete local video file from disk
    if (video.filePath) {
      const diskPath = path.join(__dirname, '../..', video.filePath);
      if (fs.existsSync(diskPath)) {
        fs.unlinkSync(diskPath);
      }
    }

    // Delete thumbnail if present
    if (video.thumbnailPath) {
      const thumbDiskPath = path.join(__dirname, '../..', video.thumbnailPath);
      if (fs.existsSync(thumbDiskPath)) {
        fs.unlinkSync(thumbDiskPath);
      }
    }

    await Video.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Video and media files deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadVideoFile,
  getVideoById,
  getProjectVersions,
  updateVideoStatus,
  deleteVideo,
};
