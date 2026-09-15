const Client = require('../models/Client');
const Project = require('../models/Project');
const Activity = require('../models/Activity');

/**
 * @desc    Get dashboard metrics tailored to current user role
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const role = req.user.role;
    let stats = {};

    if (role === 'ADMIN') {
      const [
        totalClients,
        totalProjects,
        activeProjects,
        inReviewProjects,
        approvedProjects,
        pendingFeedbackProjects,
        recentActivities,
      ] = await Promise.all([
        Client.countDocuments(),
        Project.countDocuments(),
        Project.countDocuments({
          status: { $in: ['IN_PROGRESS', 'IN_REVIEW', 'CHANGES_REQUESTED'] },
        }),
        Project.countDocuments({ status: 'IN_REVIEW' }),
        Project.countDocuments({ status: { $in: ['APPROVED', 'COMPLETED'] } }),
        Project.countDocuments({ status: 'CHANGES_REQUESTED' }),
        Activity.find()
          .populate('userId', 'name email avatar role')
          .populate('projectId', 'name')
          .sort({ createdAt: -1 })
          .limit(8),
      ]);

      stats = {
        role: 'ADMIN',
        totalClients,
        totalProjects,
        activeProjects,
        inReviewProjects,
        approvedProjects,
        pendingFeedbackProjects,
        recentActivities,
      };
    } else if (role === 'EDITOR') {
      const editorId = req.user._id;
      const [
        assignedProjects,
        inReviewProjects,
        pendingFeedbackProjects,
        recentActivities,
      ] = await Promise.all([
        Project.countDocuments({ assignedEditorId: editorId }),
        Project.countDocuments({
          assignedEditorId: editorId,
          status: 'IN_REVIEW',
        }),
        Project.countDocuments({
          assignedEditorId: editorId,
          status: 'CHANGES_REQUESTED',
        }),
        Activity.find({
          projectId: {
            $in: await Project.find({ assignedEditorId: editorId }).distinct(
              '_id'
            ),
          },
        })
          .populate('userId', 'name email avatar role')
          .populate('projectId', 'name')
          .sort({ createdAt: -1 })
          .limit(8),
      ]);

      stats = {
        role: 'EDITOR',
        assignedProjects,
        inReviewProjects,
        pendingFeedbackProjects,
        recentlyUploadedVideos: 0,
        recentActivities,
      };
    } else if (role === 'CLIENT') {
      const clientRecord = await Client.findOne({ email: req.user.email });
      let activeProjects = 0;
      let inReviewProjects = 0;
      let changeRequests = 0;
      let approvedProjects = 0;
      let recentActivities = [];

      if (clientRecord) {
        const clientProjects = await Project.find({ clientId: clientRecord._id });
        const projectIds = clientProjects.map((p) => p._id);

        [
          activeProjects,
          inReviewProjects,
          changeRequests,
          approvedProjects,
          recentActivities,
        ] = await Promise.all([
          Project.countDocuments({
            clientId: clientRecord._id,
            status: { $in: ['IN_PROGRESS', 'IN_REVIEW', 'CHANGES_REQUESTED'] },
          }),
          Project.countDocuments({
            clientId: clientRecord._id,
            status: 'IN_REVIEW',
          }),
          Project.countDocuments({
            clientId: clientRecord._id,
            status: 'CHANGES_REQUESTED',
          }),
          Project.countDocuments({
            clientId: clientRecord._id,
            status: { $in: ['APPROVED', 'COMPLETED'] },
          }),
          Activity.find({ projectId: { $in: projectIds } })
            .populate('userId', 'name email avatar role')
            .populate('projectId', 'name')
            .sort({ createdAt: -1 })
            .limit(8),
        ]);
      }

      stats = {
        role: 'CLIENT',
        activeProjects,
        videosWaitingForReview: inReviewProjects,
        changeRequests,
        approvedVideos: approvedProjects,
        recentActivities,
      };
    }

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
