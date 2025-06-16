const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    identifier: {
        type: String,
        required: [true, 'Phone number or email is required'],
        trim: true
    },
    otp: {
        type: String,
        required: [true, 'OTP is required'],
        trim: true
    },
    type: {
        type: String,
        enum: ['phone', 'email'],
        required: [true, 'OTP type is required']
    },
    purpose: {
        type: String,
        enum: ['signup', 'login', 'reset'],
        default: 'login'
    },
    attempts: {
        type: Number,
        default: 0,
        max: 5
    },
    verified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600 // Document will be automatically deleted after 10 minutes
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// Indexes
otpSchema.index({ identifier: 1, type: 1 });
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 }); // Backup TTL index

// Methods
otpSchema.methods.isExpired = function() {
    return Date.now() >= this.expiresAt;
};

otpSchema.methods.incrementAttempts = async function() {
    this.attempts += 1;
    if (this.attempts >= 5) {
        this.verified = false;
        await this.save();
        throw new Error('Maximum verification attempts exceeded');
    }
    return this.save();
};

// Static methods
otpSchema.statics.findValidOTP = async function(identifier, type) {
    return this.findOne({
        identifier,
        type,
        verified: false,
        expiresAt: { $gt: Date.now() },
        attempts: { $lt: 5 }
    }).sort({ createdAt: -1 });
};

otpSchema.statics.removeAllUserOTPs = async function(identifier) {
    return this.deleteMany({ identifier });
};

// Pre-save middleware
otpSchema.pre('save', async function(next) {
    // If this is a new OTP, remove all existing unverified OTPs for this identifier and type
    if (this.isNew) {
        await this.constructor.deleteMany({
            identifier: this.identifier,
            type: this.type,
            verified: false
        });
    }
    next();
});

// Create TTL index for automatic document expiration
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
