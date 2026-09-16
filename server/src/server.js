const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const projectRoutes = require('./routes/projectRoutes');
const videoRoutes = require('./routes/videoRoutes');
const commentRoutes = require('./routes/commentRoutes');
const annotationRoutes = require('./routes/annotationRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reviewLinkRoutes = require('./routes/reviewLinkRoutes');

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, '../uploads'),
  path.join(__dirname, '../uploads/videos'),
  path.join(__dirname, '../uploads/thumbnails'),
  path.join(__dirname, '../uploads/audio'),
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[Storage] Initialized directory: ${dir}`);
  }
});

// Initialize Express
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// Attach io instance to app
app.set('io', io);

// Security & Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows cross-origin video/thumbnail streaming
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve uploaded media statically with proper headers for video streaming
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    setHeaders: (res, filePath) => {
      res.set('Accept-Ranges', 'bytes');
    },
  })
);

// Health Check Route
app.use('/api/health', healthRoutes);

// Authentication & User Routes
app.use('/api/auth', authRoutes);

// Core Business Domain Routes
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/annotations', annotationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/review-links', reviewLinkRoutes);

// In-memory presence tracker: roomId -> Map<socketId, userInfo>
const roomUsers = new Map();

// Helper to get array of online users in a room
const getRoomUsers = (roomId) => {
  const usersMap = roomUsers.get(roomId);
  if (!usersMap) return [];
  // Return unique users by user._id or fallback to socketId
  const unique = new Map();
  for (const [sockId, userInfo] of usersMap.entries()) {
    const key = userInfo?.id || userInfo?._id || sockId;
    if (!unique.has(key)) {
      unique.set(key, { ...userInfo, socketId: sockId });
    }
  }
  return Array.from(unique.values());
};

// Helper to remove socket from a room's presence
const removeSocketFromRoom = (roomId, socketId) => {
  const usersMap = roomUsers.get(roomId);
  if (usersMap) {
    usersMap.delete(socketId);
    if (usersMap.size === 0) {
      roomUsers.delete(roomId);
    }
  }
};

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Project Level Room
  socket.on('join_project', (data) => {
    const projectId = typeof data === 'string' ? data : data?.projectId;
    if (!projectId) return;
    const room = `project:${projectId}`;
    socket.join(room);
    console.log(`[Socket.io] Socket ${socket.id} joined project room: ${room}`);
  });

  socket.on('leave_project', (data) => {
    const projectId = typeof data === 'string' ? data : data?.projectId;
    if (!projectId) return;
    const room = `project:${projectId}`;
    socket.leave(room);
    console.log(`[Socket.io] Socket ${socket.id} left project room: ${room}`);
  });

  // Video Review Room with Active Presence
  socket.on('join_video_review', (data) => {
    const { videoId, user } = data || {};
    if (!videoId) return;
    const room = `video:${videoId}`;
    socket.join(room);

    // Track user presence
    if (!roomUsers.has(room)) {
      roomUsers.set(room, new Map());
    }
    const safeUser = user || {
      id: socket.id,
      name: 'Guest Reviewer',
      role: 'VIEWER',
      avatar: null,
    };
    roomUsers.get(room).set(socket.id, safeUser);

    const activeList = getRoomUsers(room);
    console.log(`[Socket.io] ${safeUser.name} joined ${room}. Active in room: ${activeList.length}`);

    // Broadcast updated presence to everyone in the room
    io.to(room).emit('room_presence', {
      videoId,
      users: activeList,
    });

    // Notify other peers of user joined
    socket.to(room).emit('user_joined', {
      videoId,
      user: safeUser,
    });
  });

  socket.on('leave_video_review', (data) => {
    const { videoId } = data || {};
    if (!videoId) return;
    const room = `video:${videoId}`;
    socket.leave(room);
    removeSocketFromRoom(room, socket.id);

    const activeList = getRoomUsers(room);
    io.to(room).emit('room_presence', {
      videoId,
      users: activeList,
    });
    console.log(`[Socket.io] Socket ${socket.id} left ${room}`);
  });

  // Live Canvas Annotation Relay (real-time drawing broadcast)
  socket.on('drawing_stroke', (data) => {
    const { videoId, shape } = data || {};
    if (!videoId) return;
    socket.to(`video:${videoId}`).emit('drawing_stroke', data);
  });

  socket.on('drawing_clear', (data) => {
    const { videoId } = data || {};
    if (!videoId) return;
    socket.to(`video:${videoId}`).emit('drawing_clear', data);
  });

  // Co-Watch Playback Synchronization
  socket.on('cowatch_sync', (data) => {
    const { videoId } = data || {};
    if (!videoId) return;
    // Relay to other viewers in the same video room
    socket.to(`video:${videoId}`).emit('cowatch_sync', data);
  });

  // Handle Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    // Clean up socket from any rooms it was tracked in
    for (const [room, usersMap] of roomUsers.entries()) {
      if (usersMap.has(socket.id)) {
        const leavingUser = usersMap.get(socket.id);
        usersMap.delete(socket.id);
        if (usersMap.size === 0) {
          roomUsers.delete(room);
        }
        const activeList = getRoomUsers(room);
        io.to(room).emit('room_presence', {
          roomId: room,
          users: activeList,
        });
        io.to(room).emit('user_left', {
          socketId: socket.id,
          user: leavingUser,
        });
      }
    }
  });
});

// 404 & Centralized Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

// Server startup
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to Database
  await connectDB();

  server.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`🚀 VideoFlow Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    console.log(`=============================================`);
  });
};

startServer();

module.exports = { app, server, io };
