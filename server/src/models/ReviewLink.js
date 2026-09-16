const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const reviewLinkSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => crypto.randomBytes(24).toString('hex'),
    },
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: 'Client Review Link',
    },
    allowComments: {
      type: Boolean,
      default: true,
    },
    allowDownload: {
      type: Boolean,
      default: false,
    },
    requirePasscode: {
      type: Boolean,
      default: false,
    },
    passcodeHash: {
      type: String,
      default: null,
      select: false,
    },
    expiresAt: {
      type: Date,
      default: null, // null means never expires
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    lastViewedAt: {
      type: Date,
      default: null,
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'CHANGES_REQUESTED'],
      default: 'PENDING',
    },
    clientReviewerName: {
      type: String,
      trim: true,
      default: null,
    },
    clientReviewerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    approvalNotes: {
      type: String,
      default: '',
    },
    decidedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify passcode
reviewLinkSchema.methods.matchPasscode = async function (enteredPasscode) {
  if (!this.passcodeHash) return true;
  return await bcrypt.compare(enteredPasscode, this.passcodeHash);
};

// Check if link is currently valid
reviewLinkSchema.methods.isValid = function () {
  if (!this.isActive) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
};

module.exports = mongoose.model('ReviewLink', reviewLinkSchema);
