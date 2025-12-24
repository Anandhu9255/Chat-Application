const Message = require('../models/Message');
const Chat = require('../models/Chat');

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) return res.status(400).json({ message: 'chatId required' });

    const messages = await Message.find({ chat: chatId })
      .populate('sender', '-password')
      .populate('readBy.user', 'name email')
      .sort({ createdAt: 1 });

    res.json(messages); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    if (!chatId || !content) return res.status(400).json({ message: 'chatId and content required' });

    // 1. Save new message
    const message = new Message({ 
      chat: chatId, 
      sender: req.user._id || req.user.id, 
      content 
    });
    await message.save();

    // 2. Populate fully
    const populated = await Message.findById(message._id)
      .populate('sender', '-password')
      .populate({ 
        path: 'chat', 
        populate: { path: 'users', select: '-password' } 
      });

    // 3. CRITICAL: Update the Chat document with this message as the latest
    await Chat.findByIdAndUpdate(chatId, { 
      latestMessage: populated._id, 
      updatedAt: Date.now() 
    });

    // 4. Emit via Socket
    try {
      const io = req.app.get('io');
      if (io && populated && populated.chat) {
        // Send to chat room
        io.to(chatId.toString()).emit('receive_message', populated);

        // Send to individual users for sidebar update
        populated.chat.users.forEach(user => {
          if (String(user._id) !== String(req.user._id || req.user.id)) {
            io.to(String(user._id)).emit('receive_message', populated);
          }
        });
      }
    } catch (emitErr) {
      console.error('Emit error:', emitErr);
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id || req.user.id;
    if (!chatId) return res.status(400).json({ message: 'chatId required' });
    
    await Message.updateMany(
      { chat: chatId, 'readBy.user': { $ne: userId } }, 
      { $push: { readBy: { user: userId, at: Date.now() } } }
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};