const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },

        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },

        mobile: {
            type: String,
            trim: true,
            // Existing accounts can still log in before adding their mobile number.
            required: function () { return this.isNew || this.isModified('mobile'); },
            match: [/^\+[1-9][0-9]{7,14}$/, 'Include the country code in your mobile number'],
        },
        emailVerified: { type: Boolean, default: false },

        password: {
            type: String,
            required: [true, 'Password is required'],
        },

        gender: {
            type: String,
            enum: ['male', 'female'],
            required: true,
        },

        profilePic: {
            type: String,
            default: '',
        },

        status: {
            type: String,
            enum: ['online', 'offline'],
            default: 'offline',
        },

        lastSeen: {
            type: Date,
            default: null,
        },
        theme: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'system',
        },

        preferredLanguage: {
            type: String,
            enum: ['english', 'telugu', 'hindi'],
            default: 'english',
        },
    },
    {
        timestamps: true,
    }
);

// Exclude legacy accounts without a mobile number from the unique index.
userSchema.index({ mobile: 1 }, {
    unique: true,
    partialFilterExpression: { mobile: { $type: 'string', $gt: '' } },
});

module.exports =
    mongoose.models.User ||
    mongoose.model('User', userSchema);