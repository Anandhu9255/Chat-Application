require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const messageRoutes = require('./routes/message');
const userRoutes = require('./routes/users');
const User = require('./models/User');
const Message = require('./models/Message');
const jwt = require('jsonwebtoken');

const app = express();

const allowedOrigins = [
  "https://chat-application-two-brown.vercel.app",
  "http://localhost:5173"
];

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true 
}));

app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => res.send('Chat backend running'));

const httpServer = http.createServer(app);

const io = new Server(httpServer, { 
  cors: { 
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  } 
});

app.set('io', io);

const onlineUsers = {}; 

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || (socket.handshake.headers?.authorization?.split(' ')[1]);
    if (!token) return next(new Error('Authentication error'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    return next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  if (socket.userId) {
    User.findByIdAndUpdate(socket.userId, { isOnline: true }, { new: true })
      .then(user => {
        onlineUsers[socket.userId] = socket.id;
        socket.join(socket.userId);
        io.emit('user-online', { userId: socket.userId, isOnline: true });
      })
      .catch(e => console.error("Online update error", e));
  }

  socket.on('request-online-status', () => {
    socket.emit('online-users-list', Object.keys(onlineUsers));
  });

  socket.on('setup', (userId) => {
    socket.join(userId);
    io.emit('user-online', { userId, isOnline: true });
  });

  socket.on('join chat', (chatId) => socket.join(chatId));
  
  socket.on('typing', (chatId) => socket.to(chatId).emit('typing', chatId));
  socket.on('stop typing', (chatId) => socket.to(chatId).emit('stop typing', chatId));

  socket.on('new message', (message) => {
    const chatId = message.chat?._id || message.chat;
    if (chatId) io.to(String(chatId)).emit('receive_message', message);
  });

  socket.on('message read', async (chatId) => {
    try {
      if (!socket.userId || !chatId) return;
      await Message.updateMany(
        { chat: new mongoose.Types.ObjectId(chatId), readBy: { $ne: new mongoose.Types.ObjectId(socket.userId) } }, 
        { $addToSet: { readBy: new mongoose.Types.ObjectId(socket.userId) } }
      );
      socket.to(chatId).emit('message read', { chatId, userId: socket.userId });
    } catch (e) {}
  });

  socket.on('disconnect', () => {
    const uid = socket.userId;
    if (uid) {
      if (onlineUsers[uid] === socket.id) {
        delete onlineUsers[uid];
      }

      setTimeout(async () => {
        if (!onlineUsers[uid]) {
          const now = new Date();
          try {
            await User.findByIdAndUpdate(uid, { isOnline: false, lastSeen: now });
            io.emit('user-offline', { userId: uid, lastSeen: now });
          } catch (err) {
            console.error("Last seen update failed", err);
          }
        }
      }, 3000); 
    }
  });
});

const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));