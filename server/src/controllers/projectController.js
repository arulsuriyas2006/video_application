const Project = require('../models/Project');
const Client = require('../models/Client');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

/**
 * @desc    Get all projects (role-aware + search/filter)
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = async (req, res, next) => {
  try {
    const { status, priority, clientId, search } = req.query;
    let filter = {};

    // Role-based visibility
    if (req.user.role === 'EDITOR') {
      filter.assignedEditorId = req.user._id;
    } else if (req.user.role === 'CLIENT') {
      // Find client records matching this user's email
      const clientRecord = await Client.findOne({ email: req.user.email });
      if (clientRecord) {
        filter.clientId = clientRecord._id;
      } else {
        // No client record found matching email -> empty list
        return res.status(200).json({ success: true, data: [] });
      }
    }

    // Additional query filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (clientId) filter.clientId = clientId;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const projects = await Project.find(filter)
      .populate('clientId', 'name email company avatar')
      .populate('assignedEditorId', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single project details
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('clientId', 'name email company phone avatar')
      .populate('assignedEditorId', 'name email avatar role')
      .populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Role permission check
    if (req.user.role === 'EDITOR') {
      if (
        !project.assignedEditorId ||
        project.assignedEditorId._id.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not assigned to this project',
        });
      }
    } else if (req.user.role === 'CLIENT') {
      const clientRecord = await Client.findOne({ email: req.user.email });
      if (
        !clientRecord ||
        project.clientId._id.toString() !== clientRecord._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: This project does not belong to your client account',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new project
 * @route   POST /api/projects
 * @access  Private (Admin only)
 */
const createProject = async (req, res, next) => {
  try {
    const {
      name,
      description,
      brief,
      clientId,
      assignedEditorId,
      status,
      priority,
      dueDate,
    } = req.body;

    if (!name || !clientId) {
      return res.status(400).json({
        success: false,
        message: 'Project name and client selection are required',
      });
    }

    // Verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Selected client does not exist',
      });
    }

    const project = await Project.create({
      name,
      description: description || '',
      brief: brief || '',
      clientId,
      assignedEditorId: assignedEditorId || null,
      status: status || 'DRAFT',
      priority: priority || 'MEDIUM',
      dueDate: dueDate || null,
      createdBy: req.user._id,
    });

    // Create Activity Log
    await Activity.create({
      projectId: project._id,
      userId: req.user._id,
      type: 'PROJECT_CREATED',
      message: `${req.user.name} created project "${project.name}" for ${client.company}`,
    });

    // If editor assigned immediately, create notification & activity
    if (assignedEditorId) {
      await Notification.create({
        userId: assignedEditorId,
        projectId: project._id,
        type: 'PROJECT_ASSIGNED',
        message: `Admin assigned Project "${project.name}" to you.`,
      });

      await Activity.create({
        projectId: project._id,
        userId: req.user._id,
        type: 'EDITOR_ASSIGNED',
        message: `Assigned editor to project "${project.name}"`,
      });
    }

    const populatedProject = await Project.findById(project._id)
      .populate('clientId', 'name email company avatar')
      .populate('assignedEditorId', 'name email avatar')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedProject,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private (Admin or assigned Editor)
 */
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // If Editor, only allowed to update status if assigned
    if (req.user.role === 'EDITOR') {
      if (
        !project.assignedEditorId ||
        project.assignedEditorId.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this project',
        });
      }
      // Editor can only update status or brief
      if (req.body.status) project.status = req.body.status;
      if (req.body.brief !== undefined) project.brief = req.body.brief;
    } else {
      // Admin can update all fields
      const {
        name,
        description,
        brief,
        clientId,
        assignedEditorId,
        status,
        priority,
        dueDate,
      } = req.body;

      const previousEditor = project.assignedEditorId
        ? project.assignedEditorId.toString()
        : null;
      const previousStatus = project.status;

      if (name) project.name = name;
      if (description !== undefined) project.description = description;
      if (brief !== undefined) project.brief = brief;
      if (clientId) project.clientId = clientId;
      if (status) project.status = status;
      if (priority) project.priority = priority;
      if (dueDate !== undefined) project.dueDate = dueDate;
      if (assignedEditorId !== undefined) project.assignedEditorId = assignedEditorId || null;

      // Check if editor assignment changed
      const newEditor = project.assignedEditorId
        ? project.assignedEditorId.toString()
        : null;
      if (newEditor && newEditor !== previousEditor) {
        await Notification.create({
          userId: project.assignedEditorId,
          projectId: project._id,
          type: 'PROJECT_ASSIGNED',
          message: `Admin assigned Project "${project.name}" to you.`,
        });

        await Activity.create({
          projectId: project._id,
          userId: req.user._id,
          type: 'EDITOR_ASSIGNED',
          message: `${req.user.name} assigned an editor to "${project.name}"`,
        });
      }

      // Check if status changed
      if (status && status !== previousStatus) {
        await Activity.create({
          projectId: project._id,
          userId: req.user._id,
          type: 'PROJECT_UPDATED',
          message: `Project status updated from ${previousStatus} to ${status}`,
        });
      }
    }

    await project.save();

    const populated = await Project.findById(project._id)
      .populate('clientId', 'name email company avatar')
      .populate('assignedEditorId', 'name email avatar')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private (Admin only)
 */
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    // Clean up related activities
    await Activity.deleteMany({ projectId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get activities for a project
 * @route   GET /api/projects/:id/activities
 * @access  Private
 */
const getProjectActivities = async (req, res, next) => {
  try {
    const activities = await Activity.find({ projectId: req.params.id })
      .populate('userId', 'name email avatar role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectActivities,
};
