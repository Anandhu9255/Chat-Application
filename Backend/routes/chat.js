const express = require('express');
const router = express.Router();
const { accessChat, getChats } = require('../controllers/chatController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, accessChat); // create or get one-to-one chat
router.get('/', auth, getChats); // get user's chats

module.exports = router;
