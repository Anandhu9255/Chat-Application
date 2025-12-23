require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const messageRoutes = require('./routes/message');
const userRoutes = require('./routes/users');

const app = express();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// Security middleware (run before routes)
app.use(helmet());
// Update: Allows your frontend URL to connect securely
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(mongoSanitize());

// basic rate limiter for API
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', apiLimiter);

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => res.send('Chat backend running'));

const httpServer = http.createServer(app);
// Update: Uses environment variable for socket security
const io = new Server(httpServer, { cors: { origin: process.env.CORS_ORIGIN || '*' } });

// make io available to controllers via app.get('io')
app.set('io', io);

const jwt = require('jsonwebtoken');
const User = require('./models/User');

const onlineUsers = {}; // userId -> socketId
const socketUser = {}; // socketId -> userId

// Socket auth middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || (socket.handshake.headers && socket.handshake.headers.authorization && socket.handshake.headers.authorization.split(' ')[1]);
    if (!token) return next(new Error('Authentication error'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new Error('Authentication error'));
    socket.user = user;
    return next();
  } catch (err) {
    console.error('Socket auth error', err.message);
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id, 'user:', socket.userId || 'anonymous');

  if (socket.userId) {
    onlineUsers[socket.userId] = socket.id;
    socketUser[socket.id] = socket.userId;
    socket.join(socket.userId);
    io.emit('user-online', socket.userId);
  }

  socket.on('setup', (userId) => {
    if (!userId) return;
    onlineUsers[userId] = socket.id;
    socketUser[socket.id] = userId;
    socket.join(userId);
    io.emit('user-online', userId);
  });

  socket.on('join chat', (chatId) => {
    if (!chatId) return;
    socket.join(chatId);
  });

  socket.on('join_chat', (chatId) => {
    if (!chatId) return;
    socket.join(chatId);
  });

  socket.on('typing', (chatId) => socket.to(chatId).emit('typing', chatId));
  socket.on('stop typing', (chatId) => socket.to(chatId).emit('stop typing', chatId));

  socket.on('new message', (message) => {
    try {
      const chatId = (message && (message.chat || message.chatId || message.conversationId));
      if (!chatId) return;
      io.to(String(chatId)).emit('receive_message', message);
    } catch (err) {
      console.error('Socket new message error', err);
    }
  });

  socket.on('message read', async (chatId) => {
    try {
      // Fix: Updated to check socket.userId correctly
      if (!socket.userId) return; 
      const Message = require('./models/Message');
      await Message.updateMany({ chat: chatId, readBy: { $ne: socket.userId } }, { $push: { readBy: socket.userId } });
      socket.to(chatId).emit('message read', { chatId, userId: socket.userId });
    } catch (err) {
      console.error('message read error', err);
    }
  });

  socket.on('disconnect', () => {
    const uid = socketUser[socket.id];
    if (uid) {
      delete onlineUsers[uid];
      delete socketUser[socket.id];
      io.emit('user-offline', uid);
    }
    console.log('Socket disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});