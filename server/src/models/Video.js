const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Video must be associated with a project'],
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    title: {
      type: String,
      required: [true, 'Please provide a video title'],
      trim: true,
      maxlength: [140, 'Video title cannot exceed 140 characters'],
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    thumbnailPath: {
      type: String,
      default: '',
    },
    duration: {
      type: Number,
      default: 0, // in seconds
    },
    width: {
      type: Number,
      default: 0,
    },
    height: {
      type: Number,
      default: 0,
    },
    fileSize: {
      type: Number,
      default: 0, // in bytes
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ['DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'FINAL'],
        message: '{VALUE} is not a valid video status',
      },
      default: 'IN_REVIEW',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying project versions
videoSchema.index({ projectId: 1, versionNumber: 1 });

module.exports = mongoose.model('Video', videoSchema);
