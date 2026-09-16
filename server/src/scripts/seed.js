const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Client = require('../models/Client');
const Project = require('../models/Project');
const Video = require('../models/Video');
const Comment = require('../models/Comment');
const Annotation = require('../models/Annotation');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const ReviewLink = require('../models/ReviewLink');

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
    await Video.deleteMany({});
    await Comment.deleteMany({});
    await Annotation.deleteMany({});
    await Activity.deleteMany({});
    await Notification.deleteMany({});
    await ReviewLink.deleteMany({});
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
      brief: 'Deliver high-octane visual pacing with quick match cuts. The color grade needs high contrast neon accents. Music track must sync to footfalls at 00:04 and 00:09.',
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

    // 4. Create Video Cuts for Project 1
    const v1 = await Video.create({
      projectId: p1._id,
      versionNumber: 1,
      title: 'Nike Summer Campaign - Rough Assembly V1',
      originalFileName: 'nike_rough_assembly.mp4',
      filePath: '/uploads/videos/video-1789492324778-462306357.mp4',
      thumbnailPath: '',
      duration: 15.4,
      width: 1920,
      height: 1080,
      fileSize: 4820000,
      uploadedBy: editor._id,
      status: 'CHANGES_REQUESTED',
    });

    const v2 = await Video.create({
      projectId: p1._id,
      versionNumber: 2,
      title: 'Nike Summer Campaign - Color Graded V2',
      originalFileName: 'nike_color_graded_v2.mp4',
      filePath: '/uploads/videos/video-1789492327050-533212147.mp4',
      thumbnailPath: '',
      duration: 15.4,
      width: 1920,
      height: 1080,
      fileSize: 5240000,
      uploadedBy: editor._id,
      status: 'IN_REVIEW',
    });

    console.log('[Seed] Created Video Cuts (V1 & V2)');

    // 5. Create Comments & Threaded Replies on V2
    const comment1 = await Comment.create({
      videoId: v2._id,
      projectId: p1._id,
      userId: clientUser._id,
      timestamp: 2.5,
      message: 'The motion title text enters slightly too early. Can we delay the entrance by 0.5s?',
      status: 'OPEN',
      hasAnnotation: true,
    });

    // Create Annotation linked to comment 1
    const annotation1 = await Annotation.create({
      videoId: v2._id,
      projectId: p1._id,
      commentId: comment1._id,
      userId: clientUser._id,
      timestamp: 2.5,
      shapes: [
        {
          type: 'RECTANGLE',
          color: '#f59e0b',
          strokeWidth: 3,
          rect: { x: 0.25, y: 0.3, width: 0.5, height: 0.25 },
        },
        {
          type: 'ARROW',
          color: '#ef4444',
          strokeWidth: 3,
          arrow: { startX: 0.15, startY: 0.42, endX: 0.25, endY: 0.42 },
        },
      ],
    });

    comment1.annotationId = annotation1._id;
    await comment1.save();

    // Editor Reply to Comment 1
    await Comment.create({
      videoId: v2._id,
      projectId: p1._id,
      userId: editor._id,
      parentCommentId: comment1._id,
      timestamp: 2.5,
      message: 'Got it Sarah! Adjusted the keyframe in After Effects. Timing feels much punchier now.',
      status: 'OPEN',
    });

    // Comment 2 (Resolved)
    const comment2 = await Comment.create({
      videoId: v2._id,
      projectId: p1._id,
      userId: admin._id,
      timestamp: 7.8,
      message: 'Color grading on the athlete looks exceptional with the teal & orange contrast.',
      status: 'RESOLVED',
      resolvedBy: editor._id,
      resolvedAt: new Date(),
    });

    // Comment 3 (Voice note demo indicator)
    const comment3 = await Comment.create({
      videoId: v2._id,
      projectId: p1._id,
      userId: clientUser._id,
      timestamp: 12.0,
      message: '🎙️ Voice note attached: Sound mix balancing notes for the closing brand tagline.',
      status: 'OPEN',
      hasVoiceNote: true,
      voiceNoteDuration: 8.4,
    });

    console.log('[Seed] Created Comments, Replies, Annotations & Voice Notes');

    // 6. Create Pre-Seeded Client Review Link for Instant Testing
    const salt = await bcrypt.genSalt(10);
    const passcodeHash = await bcrypt.hash('Client2026!', salt);

    const reviewLink = await ReviewLink.create({
      token: 'nike-hero-cut-review-2026',
      videoId: v2._id,
      projectId: p1._id,
      createdBy: editor._id,
      title: 'Nike Summer Campaign V2 — Client Sign-Off',
      allowComments: true,
      allowDownload: true,
      requirePasscode: true,
      passcodeHash,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      isActive: true,
      viewsCount: 3,
      approvalStatus: 'PENDING',
    });

    console.log('[Seed] Created Client Review Link: /review/share/nike-hero-cut-review-2026 (Passcode: Client2026!)');

    // 7. Create Activities
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
        projectId: p1._id,
        userId: editor._id,
        type: 'NEW_VERSION_UPLOADED',
        message: 'Marcus Chen uploaded "Nike Summer Campaign - Color Graded V2"',
      },
      {
        projectId: p1._id,
        userId: clientUser._id,
        type: 'COMMENT_CREATED',
        message: 'Sarah Jenkins added feedback at 00:02: "The motion title text enters slightly too early..."',
      },
      {
        projectId: p1._id,
        userId: editor._id,
        type: 'REPLY_ADDED',
        message: 'Marcus Chen replied: "Got it Sarah! Adjusted the keyframe in After Effects."',
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
    ]);

    // 8. Create Notifications
    await Notification.create([
      {
        userId: editor._id,
        projectId: p1._id,
        videoId: v2._id,
        type: 'NEW_COMMENT',
        message: 'Sarah Jenkins commented on "Nike Summer Campaign - Color Graded V2"',
      },
      {
        userId: clientUser._id,
        projectId: p1._id,
        videoId: v2._id,
        type: 'COMMENT_REPLY',
        message: 'Marcus Chen replied to your feedback at 00:02',
      },
    ]);

    console.log('[Seed] Created Activities & Notifications');

    console.log('\n==================================================================');
    console.log('🎉 VIDEOFLOW COMPLETE SEED INITIALIZED SUCCESSFULLY!');
    console.log('==================================================================');
    console.log('🔑 TEST ACCOUNTS:');
    console.log('   👑 Admin:  admin@videoflow.local  / AdminPass123!');
    console.log('   🎬 Editor: editor@videoflow.local / EditorPass123!');
    console.log('   💼 Client: client@videoflow.local / ClientPass123!');
    console.log('------------------------------------------------------------------');
    console.log('🔗 PUBLIC CLIENT REVIEW LINK (Passcode Protected):');
    console.log('   URL:      http://localhost:5173/review/share/nike-hero-cut-review-2026');
    console.log('   Passcode: Client2026!');
    console.log('------------------------------------------------------------------');
    console.log('📊 DATA SUMMARY:');
    console.log(`   Users: 3 | Clients: 3 | Projects: 4 | Videos: 2 cuts | Comments: 3`);
    console.log('==================================================================\n');

    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Error: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
