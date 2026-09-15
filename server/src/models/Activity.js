const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'PROJECT_CREATED',
        'PROJECT_UPDATED',
        'EDITOR_ASSIGNED',
        'VIDEO_UPLOADED',
        'NEW_VERSION_UPLOADED',
        'COMMENT_CREATED',
        'COMMENT_RESOLVED',
        'REPLY_ADDED',
        'CHANGES_REQUESTED',
        'VIDEO_APPROVED',
      ],
      default: 'PROJECT_UPDATED',
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

module.exports = mongoose.model('Activity', activitySchema);
