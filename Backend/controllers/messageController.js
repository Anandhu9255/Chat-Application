const Message = require('../models/Message');
const Chat = require('../models/Chat');

exports.sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    if (!chatId || !content) return res.status(400).json({ message: 'chatId and content required' });

    const message = new Message({ chat: chatId, sender: req.user._id, content });
    await message.save();

    // update latest message on chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id, updatedAt: Date.now() });

    // Re-fetch with population (populate chat.users too) to avoid document.populate chaining issues
    const populated = await Message.findById(message._id)
      .populate('sender', '-password')
      .populate({ path: 'chat', populate: { path: 'users', select: '-password' } });

    // Emit socket events so recipients update in real-time
    try {
      const io = req.app && req.app.get && req.app.get('io')
      if (io && populated && populated.chat) {
        const chatRoomId = populated.chat._id.toString()
        // emit to chat room (primary event name)
        io.to(chatRoomId).emit('receive_message', populated)

        // emit to each participant's personal room: receive_message and new_conversation
        const senderId = String(req.user._id)
        const recipients = (populated.chat.users || []).map(u => String(u._id))
        for (const rid of recipients) {
          if (rid === senderId) continue
          // notify recipient of the message
          io.to(rid).emit('receive_message', populated)
          // also send a lightweight new_conversation event so sidebar can add it if missing
          io.to(rid).emit('new_conversation', { chat: populated.chat, latestMessage: populated })
        }
      }
    } catch (emitErr) {
      console.error('Emit error in sendMessage:', emitErr)
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) return res.status(400).json({ message: 'chatId required' });

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({ chat: chatId }).populate('sender', '-password').populate('readBy.user', 'name email').sort({ createdAt: 1 }).skip(skip).limit(limit),
      Message.countDocuments({ chat: chatId })
    ]);

    res.json({ messages, page, limit, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) return res.status(400).json({ message: 'chatId required' });
    await Message.updateMany({ chat: chatId, 'readBy.user': { $ne: req.user._id } }, { $push: { readBy: { user: req.user._id, at: Date.now() } } });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
