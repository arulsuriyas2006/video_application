const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Client = require('../models/Client');
const Project = require('../models/Project');
const Activity = require('../models/Activity');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/videoflow';
    await mongoose.connect(mongoUri);
    console.log(`[Seed] Connected to MongoDB: ${mongoUri}`);

    // Clear existing data
    await User.deleteMany({});
    await Client.deleteMany({});
    await Project.deleteMany({});
    await Activity.deleteMany({});
    console.log('[Seed] Cleared existing collections');

    // 1. Create Users
    const admin = await User.create({
      name: 'Alex Vance (Admin)',
      email: 'admin@videoflow.local',
      password: 'AdminPass123!',
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isActive: true,
    });

    const editor = await User.create({
      name: 'Marcus Chen (Editor)',
      email: 'editor@videoflow.local',
      password: 'EditorPass123!',
      role: 'EDITOR',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      isActive: true,
    });

    const clientUser = await User.create({
      name: 'Sarah Jenkins (Client)',
      email: 'client@videoflow.local',
      password: 'ClientPass123!',
      role: 'CLIENT',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      isActive: true,
    });

    console.log('[Seed] Created Users (Admin, Editor, Client)');

    // 2. Create Sample Clients
    const client1 = await Client.create({
      name: 'Sarah Jenkins',
      email: 'client@videoflow.local',
      company: 'Acme Motion Pictures',
      phone: '+1 (555) 234-5678',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      createdBy: admin._id,
    });

    const client2 = await Client.create({
      name: 'David Miller',
      email: 'david@hyperion.local',
      company: 'Hyperion Brand Studios',
      phone: '+1 (555) 987-6543',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      createdBy: admin._id,
    });

    const client3 = await Client.create({
      name: 'Elena Rostova',
      email: 'elena@starlight.local',
      company: 'Starlight Media Tech',
      phone: '+1 (555) 456-7890',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      createdBy: admin._id,
    });

    console.log('[Seed] Created 3 Clients');

    // 3. Create Sample Projects
    const p1 = await Project.create({
      name: 'Nike Summer Campaign - 60s Hero',
      description: 'Cinematic brand campaign spot showcasing urban athletics and dynamic motion typography.',
      brief: 'Deliver high-octane visual pacing with quick match cuts. The color grade needs high contrast neon accents. Music track must sync to footfalls at 00:15 and 00:32.',
      clientId: client1._id,
      assignedEditorId: editor._id,
      status: 'IN_REVIEW',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdBy: admin._id,
    });

    const p2 = await Project.create({
      name: 'Cyberpunk Game Cinematic Teaser',
      description: 'Official promotional teaser for upcoming open-world RPG title with dark synthwave soundtrack.',
      brief: 'Atmospheric rain reflections and holographic UI overlays. Opening scene must establish scale. Needs sound design pass for weapons and sirens.',
      clientId: client2._id,
      assignedEditorId: editor._id,
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdBy: admin._id,
    });

    const p3 = await Project.create({
      name: 'Porsche Taycan Performance Cut',
      description: 'Automotive showcase emphasizing electric torque and sleek aerodynamic chassis.',
      brief: 'Drone fly-through shots along the coastal highway. Client requested 30s broadcast and 15s Instagram Reels vertical versions.',
      clientId: client1._id,
      assignedEditorId: editor._id,
      status: 'CHANGES_REQUESTED',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: admin._id,
    });

    const p4 = await Project.create({
      name: 'Quantum AI Keynote Intro Reel',
      description: 'Silicon Valley tech keynote kickoff video introducing the next generation neural accelerator chip.',
      brief: '3D particle simulations transforming into circuit pathways. Clean corporate aesthetic with deep navy and cyan glow.',
      clientId: client3._id,
      assignedEditorId: editor._id,
      status: 'APPROVED',
      priority: 'LOW',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      createdBy: admin._id,
    });

    console.log('[Seed] Created 4 Projects');

    // 4. Create Activities
    await Activity.create([
      {
        projectId: p1._id,
        userId: admin._id,
        type: 'PROJECT_CREATED',
        message: 'Alex Vance created project "Nike Summer Campaign - 60s Hero"',
      },
      {
        projectId: p1._id,
        userId: admin._id,
        type: 'EDITOR_ASSIGNED',
        message: 'Assigned editor Marcus Chen to "Nike Summer Campaign - 60s Hero"',
      },
      {
        projectId: p3._id,
        userId: clientUser._id,
        type: 'CHANGES_REQUESTED',
        message: 'Sarah Jenkins requested changes on "Porsche Taycan Performance Cut"',
      },
      {
        projectId: p4._id,
        userId: clientUser._id,
        type: 'VIDEO_APPROVED',
        message: 'Elena Rostova approved final cut of "Quantum AI Keynote Intro Reel"',
      },
      {
        projectId: p2._id,
        userId: editor._id,
        type: 'PROJECT_UPDATED',
        message: 'Marcus Chen updated project status to IN_PROGRESS',
      },
    ]);

    console.log('[Seed] Created Activities');

    console.log('\n=============================================');
    console.log('✅ VideoFlow Full Seed Data Initialized!');
    console.log('---------------------------------------------');
    console.log('ADMIN:  admin@videoflow.local  / AdminPass123!');
    console.log('EDITOR: editor@videoflow.local / EditorPass123!');
    console.log('CLIENT: client@videoflow.local / ClientPass123!');
    console.log('---------------------------------------------');
    console.log('Clients: 3 | Projects: 4 | Activities: 5');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Error: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
