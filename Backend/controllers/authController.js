const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// MAKE SURE 'exports.' is at the start of every function
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashed });
    await user.save();

    const userObj = { id: user._id, name: user.name, email: user.email };
    res.status(201).json({ user: userObj });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const userObj = { id: user._id, name: user.name, email: user.email };
    
    res.json({ token, user: userObj });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    // req.user is populated by your authMiddleware
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId).select('-password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const userObj = { id: user._id, name: user.name, email: user.email };
    res.json({ user: userObj });
  } catch (err) {
    console.error("GetMe Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};