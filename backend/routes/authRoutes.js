const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.delete('/delete-account', authMiddleware, authController.deleteAccount);

module.exports = router;
