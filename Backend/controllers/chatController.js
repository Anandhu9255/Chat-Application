const Chat = require('../models/Chat');

exports.accessChat = async (req, res) => {
  try {
    const { userId } = req.body; // other user's id
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    // find existing one-to-one chat
    let chat = await Chat.findOne({ isGroupChat: false, users: { $all: [req.user._id, userId] } })
      .populate('users', '-password')
      .populate('latestMessage');

    if (chat) return res.json(chat);

    // create new chat
    chat = new Chat({ users: [req.user._id, userId] });
    await chat.save();
    chat = await Chat.findById(chat._id).populate('users', '-password');
    res.status(201).json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ users: { $in: [req.user._id] } })
      .populate('users', '-password')
      .populate('latestMessage')
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
