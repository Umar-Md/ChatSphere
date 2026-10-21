const mongoose = require('mongoose');

const pendingRegistrationSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: String,
    mobile: String,
    password: String,
    gender: String,
    otpHash: String,
    attempts: { type: Number, default: 0 },
    sentAt: Date,
    expiresAt: { type: Date, expires: 0 },
});

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);
