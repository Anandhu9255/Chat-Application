const Chat = require('../models/Chat');

exports.accessChat = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    let chat = await Chat.findOne({ isGroupChat: false, users: { $all: [req.user._id, userId] } })
      .populate('users', 'name email isOnline lastSeen') // Added status fields
      .populate('latestMessage');

    if (chat) return res.json(chat);

    chat = new Chat({ users: [req.user._id, userId] });
    await chat.save();
    chat = await Chat.findById(chat._id).populate('users', 'name email isOnline lastSeen');
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ users: { $in: [req.user._id] } })
      .populate('users', 'name email isOnline lastSeen') // Added status fields
      .populate('latestMessage')
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};