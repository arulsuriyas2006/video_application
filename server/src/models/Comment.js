const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: [true, 'Comment must be associated with a video'],
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    authorName: {
      type: String,
      default: null,
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Number,
      required: [true, 'Timestamp is required for frame-accurate feedback'],
      min: 0,
      default: 0,
    },
    message: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['OPEN', 'RESOLVED'],
      default: 'OPEN',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    hasAnnotation: {
      type: Boolean,
      default: false,
    },
    annotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Annotation',
      default: null,
    },
    hasVoiceNote: {
      type: Boolean,
      default: false,
    },
    voiceNoteUrl: {
      type: String,
      default: null,
    },
    voiceNoteDuration: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ videoId: 1, timestamp: 1 });
commentSchema.index({ projectId: 1, status: 1 });

module.exports = mongoose.model('Comment', commentSchema);
