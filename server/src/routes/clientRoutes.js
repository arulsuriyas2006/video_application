const express = require('express');
const router = express.Router();
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} = require('../controllers/clientController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(authorize('ADMIN', 'EDITOR'), getClients)
  .post(authorize('ADMIN'), createClient);

router
  .route('/:id')
  .get(getClientById)
  .put(authorize('ADMIN'), updateClient)
  .delete(authorize('ADMIN'), deleteClient);

module.exports = router;
