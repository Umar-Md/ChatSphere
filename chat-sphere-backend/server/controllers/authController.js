const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const crypto = require('crypto');
const PendingRegistration = require('../models/PendingRegistration');
const { sendRegistrationOtp } = require('../services/emailService');
const normalizeEmail = (email) => typeof email === 'string' ? email.trim().toLowerCase() : '';
const hashOtp = (email, otp) => crypto.createHash('sha256').update(`${email}:${otp}`).digest('hex');

const registerUser = async (req, res) => {
    try {
        const { name, password, gender } = req.body;
        const email = normalizeEmail(req.body.email);
        const mobile = typeof req.body.mobile === 'string' ? req.body.mobile.trim().replace(/[\s()-]/g, '').replace(/^00/, '+') : '';
        if (typeof name !== 'string' || name.trim().length < 3 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            typeof password !== 'string' || password.length < 6 ||
            !['male', 'female'].includes(gender) || !/^\+[1-9][0-9]{7,14}$/.test(mobile)) {
            return res.status(400).json({ message: 'Provide a valid name, email, password (at least 6 characters), gender and a mobile number including country code (e.g. +919876543210).' });
        }
        await User.init(); // Wait for unique indexes before accepting registrations.
        if (await User.exists({ $or: [{ email }, { mobile }] })) {
            return res.status(409).json({ message: 'An account with this email or mobile number already exists. Please login.' });
        }
        const previous = await PendingRegistration.findOne({ email });
        if (previous && Date.now() - previous.sentAt.getTime() < 60000) {
            return res.status(429).json({ message: 'Please wait 60 seconds before requesting another code.' });
        }
        const otp = String(crypto.randomInt(100000, 1000000));
        const pending = await PendingRegistration.findOneAndUpdate({ email }, {
            name: name.trim(), email, mobile, gender,
            password: await bcrypt.hash(password, 10),
            otpHash: hashOtp(email, otp), attempts: 0,
            sentAt: new Date(), expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        }, { upsert: true, new: true });
        try {
            await sendRegistrationOtp(email, otp);
        } catch (error) {
            await PendingRegistration.deleteOne({ _id: pending._id, otpHash: pending.otpHash });
            console.error('Registration email delivery failed:', error.code || 'SMTP error');
            return res.status(503).json({ message: 'Unable to send verification email. Please try again or contact support.' });
        }
        return res.status(200).json({ message: 'Verification code sent to your email. It expires in 10 minutes.', requiresVerification: true, email });
    } catch (error) {
        return res.status(error.code === 11000 ? 409 : 500).json({ message: 'Unable to start registration. Please try again.' });
    }
};

const verifyRegistration = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { otp } = req.body;
        if (!email || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({ message: 'Enter the six-digit code sent to your email.' });
        }
        // Increment atomically so concurrent guesses cannot bypass the attempt limit.
        const pending = await PendingRegistration.findOneAndUpdate({
            email, expiresAt: { $gt: new Date() }, attempts: { $lt: 5 },
        }, { $inc: { attempts: 1 } }, { new: true });
        if (!pending) {
            return res.status(400).json({ message: 'Code expired or too many attempts. Request a new code.' });
        }
        if (pending.otpHash !== hashOtp(email, otp)) {
            return res.status(400).json({ message: 'Invalid verification code.' });
        }
        await User.init();
        if (!/^\+[1-9][0-9]{7,14}$/.test(pending.mobile || '')) {
            return res.status(400).json({ message: 'Please register again with a mobile number including country code.' });
        }
        if (await User.exists({ $or: [{ email }, { mobile: pending.mobile }] })) {
            return res.status(409).json({ message: 'An account with this email or mobile number already exists. Please login.' });
        }
        // Consume this specific code once, including during concurrent verification requests.
        const consumed = await PendingRegistration.findOneAndDelete({ _id: pending._id, otpHash: pending.otpHash });
        if (!consumed) return res.status(400).json({ message: 'Code already used. Please login or request a new code.' });
        await User.create({
            name: pending.name, email, mobile: pending.mobile, password: pending.password,
            gender: pending.gender, emailVerified: true,
            profilePic: pending.gender === 'male' ? process.env.DEFAULT_MALE_AVATAR : process.env.DEFAULT_FEMALE_AVATAR,
            status: 'offline',
        });
        return res.status(201).json({ message: 'Email verified. Registration successful. Please login.' });
    } catch (error) {
        return res.status(error.code === 11000 ? 409 : 500).json({ message: error.code === 11000 ? 'An account with this email or mobile number already exists. Please login.' : 'Unable to complete registration. Please request a new code.' });
    }
};

//Login User
const loginUser = async (req, res) => {
    try {
        const { password } = req.body;
        // Keep email/mobile payloads compatible with existing API clients.
        const identifier = req.body.identifier ?? req.body.email ?? req.body.mobile;
        const value = typeof identifier === 'string' ? identifier.trim() : '';
        const isEmail = value.includes('@');
        const normalized = isEmail ? normalizeEmail(value) : value.replace(/[\s()-]/g, '').replace(/^00/, '+');

        // 1. Validate

        if (!value || typeof password !== 'string' || !password) {
            return res.status(400).json({
                message: 'All fields required',
            });
        }

        if (isEmail ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) : !/^\+[1-9][0-9]{7,14}$/.test(normalized)) {
            return res.status(400).json({ message: 'Enter a valid email or mobile number including country code (e.g. +919876543210).' });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters',
            });
        }

        // 2. Find user

        const user = await User.findOne(isEmail ? { email: normalized } : { mobile: normalized });

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }

        // 3. Compare password

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid password',
            });
        }

        // 4. Update status

        user.status = 'online';

        await user.save();

        // 5. Generate token

        const token = jwt.sign(
            {
                id: user._id,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d',
            }
        );

        // 6. Response

        res.status(200).json({
            message: 'Login successful',

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                status: user.status,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
module.exports = {
    registerUser,
    verifyRegistration,
    loginUser,
};
