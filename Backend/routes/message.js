const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, markAsRead } = require('../controllers/messageController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, sendMessage); // send message and persist
router.get('/:chatId', auth, getMessages); // get messages for a chat (supports ?page=&limit=)
router.post('/:chatId/read', auth, markAsRead);

module.exports = router;
