const User = require('../models/User');

exports.searchUsers = async (req, res) => {
  try {
    const searchQuery = req.query.search; 
    
    if (!searchQuery || searchQuery.trim() === "") {
        return res.json([]);
    }

    const regex = new RegExp(searchQuery, 'i');

    // Get your ID from the middleware's req.user object
    const myId = req.user.id;

    // Find users matching search, but NOT you
    const users = await User.find({
      $and: [
        { $or: [{ name: regex }, { email: regex }] },
        { _id: { $ne: myId } } 
      ]
    }).select('-password');

    res.json(users);
  } catch (err) {
    console.error("Search Logic Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};