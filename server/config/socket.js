const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // JWT authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 User connected: ${socket.user.name} (${userId})`);

    // Join the user's personal room
    socket.join(userId);

    // Handle typing events
    socket.on('typing', ({ conversationId, isTyping }) => {
      // Broadcast to the conversation's other participants
      socket.broadcast.emit('user_typing', {
        conversationId,
        userId,
        userName: socket.user.name,
        isTyping,
      });
    });

    // --- Bonus Stage: Live OA Proctoring ---
    
    // Join a specific OA room (Application ID)
    socket.on('join-oa-room', ({ applicationId }) => {
      socket.join(`oa-${applicationId}`);
      console.log(`🔌 User ${socket.user.name} joined OA room: oa-${applicationId}`);
    });

    // Join scoreboard room for a specific job
    socket.on('join-scoreboard', ({ jobId }) => {
      socket.join(`scoreboard-${jobId}`);
      console.log(`🔌 User ${socket.user.name} joined scoreboard room: scoreboard-${jobId}`);
    });

    // Stream code changes
    socket.on('code-change', ({ applicationId, code, language }) => {
      // Broadcast to recruiter
      socket.to(`oa-${applicationId}`).emit('live-code-update', {
        code,
        language
      });
    });

    // Proctor Warnings (Tab switching)
    socket.on('tab-switch-warning', ({ applicationId, warningsCount }) => {
      socket.to(`oa-${applicationId}`).emit('proctor-alert', {
        message: `Candidate switched tabs! (Total: ${warningsCount})`,
        warningsCount,
        timestamp: new Date()
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.user.name}`);
    });
  });

  return io;
};

module.exports = { initializeSocket };
