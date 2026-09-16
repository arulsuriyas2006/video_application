const mongoose = require('mongoose');

const shapeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['FREE_DRAW', 'ARROW', 'RECTANGLE', 'CIRCLE', 'HIGHLIGHT'],
      required: true,
    },
    color: {
      type: String,
      default: '#ef4444',
    },
    strokeWidth: {
      type: Number,
      default: 3,
    },
    // Normalized coordinates (0.0 to 1.0) for resolution-independent scaling
    points: [
      {
        x: { type: Number, min: 0, max: 1 },
        y: { type: Number, min: 0, max: 1 },
      },
    ],
    rect: {
      x: { type: Number, min: 0, max: 1 },
      y: { type: Number, min: 0, max: 1 },
      width: { type: Number, min: 0, max: 1 },
      height: { type: Number, min: 0, max: 1 },
    },
    circle: {
      cx: { type: Number, min: 0, max: 1 },
      cy: { type: Number, min: 0, max: 1 },
      rx: { type: Number, min: 0, max: 1 },
      ry: { type: Number, min: 0, max: 1 },
    },
    arrow: {
      startX: { type: Number, min: 0, max: 1 },
      startY: { type: Number, min: 0, max: 1 },
      endX: { type: Number, min: 0, max: 1 },
      endY: { type: Number, min: 0, max: 1 },
    },
  },
  { _id: false }
);

const annotationSchema = new mongoose.Schema(
  {
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    shapes: {
      type: [shapeSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

annotationSchema.index({ videoId: 1, timestamp: 1 });
annotationSchema.index({ commentId: 1 });

module.exports = mongoose.model('Annotation', annotationSchema);
