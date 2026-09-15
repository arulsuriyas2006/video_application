const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectActivities,
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(getProjects)
  .post(authorize('ADMIN'), createProject);

router
  .route('/:id')
  .get(getProjectById)
  .put(authorize('ADMIN', 'EDITOR'), updateProject)
  .delete(authorize('ADMIN'), deleteProject);

const { getProjectVersions } = require('../controllers/videoController');
const { getProjectComments } = require('../controllers/commentController');

router.route('/:id/activities').get(getProjectActivities);
router.route('/:projectId/versions').get(getProjectVersions);
router.route('/:projectId/comments').get(getProjectComments);

module.exports = router;
