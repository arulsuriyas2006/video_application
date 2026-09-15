const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a project name'],
      trim: true,
      maxlength: [140, 'Project name cannot exceed 140 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    brief: {
      type: String,
      trim: true,
      default: '',
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Project must be linked to a client'],
    },
    assignedEditorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: [
          'DRAFT',
          'IN_PROGRESS',
          'IN_REVIEW',
          'CHANGES_REQUESTED',
          'APPROVED',
          'COMPLETED',
        ],
        message: '{VALUE} is not a valid project status',
      },
      default: 'DRAFT',
    },
    priority: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        message: '{VALUE} is not a valid priority level',
      },
      default: 'MEDIUM',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast querying
projectSchema.index({ clientId: 1, status: 1 });
projectSchema.index({ assignedEditorId: 1 });

module.exports = mongoose.model('Project', projectSchema);
