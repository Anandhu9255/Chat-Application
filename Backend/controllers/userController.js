const User = require('../models/User');

exports.searchUsers = async (req, res) => {
  try {
    // UPDATED: Changed 'q' to 'search' to match frontend request
    const searchQuery = req.query.search; 
    
    if (!searchQuery) return res.json([]);

    const regex = new RegExp(searchQuery, 'i');

    // UPDATED: Added a filter to exclude the current logged-in user
    const users = await User.find({
      $and: [
        { $or: [{ name: regex }, { email: regex }] },
        { _id: { $ne: req.user.id } } // Don't show myself in search
      ]
    }).select('-password');

    res.json(users);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};