const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      default: null,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'PROJECT_ASSIGNED',
        'NEW_VIDEO_VERSION',
        'NEW_COMMENT',
        'COMMENT_REPLY',
        'CHANGES_REQUESTED',
        'VIDEO_APPROVED',
        'STATUS_UPDATE',
      ],
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
