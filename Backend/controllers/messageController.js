const Message = require('../models/Message');
const Chat = require('../models/Chat');

// 1. FIXED GET MESSAGES
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) return res.status(400).json({ message: 'chatId required' });

    // We fetch ALL messages for this chat and sort by oldest -> newest 
    // so they appear in the correct order in the chat window.
    // We remove the 'limit' and 'skip' for now to ensure no messages "disappear"
    const messages = await Message.find({ chat: chatId })
      .populate('sender', '-password')
      .populate('readBy.user', 'name email')
      .sort({ createdAt: 1 }); // 1 = Oldest to Newest (Correct for Chat UI)

    // IMPORTANT: Return the array directly so the frontend doesn't 
    // have to look inside res.data.messages
    res.json(messages); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. SEND MESSAGE (Keep your logic, just ensured it matches)
exports.sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    if (!chatId || !content) return res.status(400).json({ message: 'chatId and content required' });

    const message = new Message({ chat: chatId, sender: req.user._id, content });
    await message.save();

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id, updatedAt: Date.now() });

    const populated = await Message.findById(message._id)
      .populate('sender', '-password')
      .populate({ path: 'chat', populate: { path: 'users', select: '-password' } });

    // Socket Emission Logic
    try {
      const io = req.app.get('io');
      if (io && populated && populated.chat) {
        const chatRoomId = populated.chat._id.toString();
        
        // Emit to the specific chat room
        io.to(chatRoomId).emit('receive_message', populated);

        // Notify participants specifically for sidebar updates
        const senderId = String(req.user._id);
        const recipients = (populated.chat.users || []).map(u => String(u._id));
        
        for (const rid of recipients) {
          if (rid === senderId) continue;
          io.to(rid).emit('receive_message', populated);
          io.to(rid).emit('new_conversation', { chat: populated.chat, latestMessage: populated });
        }
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

// 3. MARK AS READ (Keep as is)
exports.markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) return res.status(400).json({ message: 'chatId required' });
    await Message.updateMany(
      { chat: chatId, 'readBy.user': { $ne: req.user._id } }, 
      { $push: { readBy: { user: req.user._id, at: Date.now() } } }
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};