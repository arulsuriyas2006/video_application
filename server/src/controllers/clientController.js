const Client = require('../models/Client');
const Project = require('../models/Project');

/**
 * @desc    Get all clients (supports search query)
 * @route   GET /api/clients
 * @access  Private (Admin & Editor)
 */
const getClients = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const clients = await Client.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Attach project counts for each client
    const clientIds = clients.map((c) => c._id);
    const projectCounts = await Project.aggregate([
      { $match: { clientId: { $in: clientIds } } },
      { $group: { _id: '$clientId', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    projectCounts.forEach((p) => {
      countMap[p._id.toString()] = p.count;
    });

    const enrichedClients = clients.map((client) => ({
      ...client.toObject(),
      projectCount: countMap[client._id.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      data: enrichedClients,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single client with project history
 * @route   GET /api/clients/:id
 * @access  Private
 */
const getClientById = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id).populate(
      'createdBy',
      'name email'
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Fetch projects belonging to this client
    const projects = await Project.find({ clientId: client._id })
      .populate('assignedEditorId', 'name email avatar')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        client,
        projects,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new client
 * @route   POST /api/clients
 * @access  Private (Admin only)
 */
const createClient = async (req, res, next) => {
  try {
    const { name, email, company, phone, avatar } = req.body;

    if (!name || !email || !company) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and company are required fields',
      });
    }

    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'A client with this email already exists',
      });
    }

    const client = await Client.create({
      name,
      email,
      company,
      phone: phone || '',
      avatar: avatar || '',
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update client
 * @route   PUT /api/clients/:id
 * @access  Private (Admin only)
 */
const updateClient = async (req, res, next) => {
  try {
    const { name, email, company, phone, avatar } = req.body;

    let client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    client.name = name || client.name;
    client.email = email || client.email;
    client.company = company || client.company;
    client.phone = phone !== undefined ? phone : client.phone;
    client.avatar = avatar !== undefined ? avatar : client.avatar;

    await client.save();

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete client
 * @route   DELETE /api/clients/:id
 * @access  Private (Admin only)
 */
const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Check if client has existing projects
    const projectCount = await Project.countDocuments({ clientId: client._id });
    if (projectCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete client: ${projectCount} active project(s) are associated with this client. Delete or reassign projects first.`,
      });
    }

    await Client.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
};
