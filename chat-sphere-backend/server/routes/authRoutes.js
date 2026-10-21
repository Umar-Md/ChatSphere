const express = require('express');
const router = express.Router();

const { registerUser, loginUser, verifyRegistration } = require('../controllers/authController');

const { rateLimit } = require('express-rate-limit');
const registrationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, message: { message: 'Too many requests. Please try again later.' } });
router.post('/register', registrationLimiter, registerUser);
router.post('/verify-email', registrationLimiter, verifyRegistration);
router.post('/login', loginUser);

module.exports = router;
