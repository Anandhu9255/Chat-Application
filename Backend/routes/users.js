const express = require('express');
const router = express.Router();
const { searchUsers } = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, searchUsers);

module.exports = router;
